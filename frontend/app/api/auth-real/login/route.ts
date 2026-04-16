import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

function hashPassword(password: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username et password requis' }, { status: 400 });
    }

    const password_hash = hashPassword(password);
    const sb = getSupabase();

    // 1. Try Supabase users table — no active filter to avoid column name issues
    let foundUser: any = null;
    let debugInfo: any = {};

    try {
      // Fetch all users matching username (case-insensitive)
      const { data: byUsername, error: e1 } = await sb
        .from('users')
        .select('*')
        .ilike('username', username)
        .limit(5);

      debugInfo.byUsername = { count: byUsername?.length, error: e1?.message };

      if (byUsername && byUsername.length > 0) {
        // Find one with matching password
        const match = byUsername.find((u: any) =>
          u.password_hash === password_hash &&
          (u.active === true || u.active === 1 || u.active === null || u.active === undefined)
        );
        if (match) foundUser = match;
      }

      // Try by email if not found
      if (!foundUser) {
        const { data: byEmail, error: e2 } = await sb
          .from('users')
          .select('*')
          .ilike('email', username)
          .limit(5);

        debugInfo.byEmail = { count: byEmail?.length, error: e2?.message };

        if (byEmail && byEmail.length > 0) {
          const match = byEmail.find((u: any) =>
            u.password_hash === password_hash &&
            (u.active === true || u.active === 1 || u.active === null || u.active === undefined)
          );
          if (match) foundUser = match;
        }
      }
    } catch (e: any) {
      debugInfo.exception = e.message;
      console.warn('Supabase users lookup failed:', e.message);
    }

    // 2. Fallback: hardcoded test accounts
    if (!foundUser) {
      const testUsers = [
        { id: 1, username: 'admin',   password: 'admin123',   role: 'admin',   full_name: 'Administrateur', email: 'admin@stock.dz',   business_units: [], active: true },
        { id: 2, username: 'manager', password: 'manager123', role: 'manager', full_name: 'Manager',         email: 'manager@stock.dz', business_units: [], active: true },
        { id: 3, username: 'user',    password: 'user123',    role: 'user',    full_name: 'Utilisateur',     email: 'user@stock.dz',    business_units: [], active: true },
      ];
      const testUser = testUsers.find(u =>
        (u.username.toLowerCase() === username.toLowerCase() ||
         u.email.toLowerCase() === username.toLowerCase()) &&
        u.password === password
      );
      if (testUser) foundUser = testUser;
    }

    if (!foundUser) {
      return NextResponse.json({
        success: false,
        error: 'Identifiants incorrects',
        debug: debugInfo  // visible in browser console for diagnosis
      }, { status: 401 });
    }

    // Generate token
    const token = Buffer.from(`${foundUser.username}:${Date.now()}`).toString('base64');

    // Fetch business units
    let businessUnits: any[] = [];
    try {
      const { data: buData } = await sb
        .from('business_units')
        .select('schema_name, bu_code, year, nom_entreprise')
        .order('year', { ascending: false });
      businessUnits = buData || [];
    } catch { /* non critique */ }

    const isAdmin = foundUser.role === 'admin';
    const userBUSchemas = isAdmin
      ? businessUnits.map((bu: any) => bu.schema_name)
      : (foundUser.business_units || []);

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        nom: foundUser.full_name || foundUser.nom || foundUser.username,
        role: foundUser.role,
        business_units: userBUSchemas
      },
      businessUnits: isAdmin ? businessUnits : businessUnits.filter((bu: any) => userBUSchemas.includes(bu.schema_name))
    });

  } catch (error: any) {
    console.error('Error in login:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur: ' + error.message }, { status: 500 });
  }
}
