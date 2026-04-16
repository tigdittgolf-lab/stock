import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Username et password requis' }, { status: 400 });
    }

    // Hash the password the same way it was stored
    const crypto = require('crypto');
    const password_hash = crypto.createHash('sha256').update(password).digest('hex');

    const sb = getSupabase();

    // 1. Try to find user in Supabase users table
    let foundUser: any = null;
    try {
      const { data: users, error } = await sb
        .from('users')
        .select('*')
        .or(`username.eq.${username},email.eq.${username}`)
        .eq('active', true)
        .limit(1);

      if (!error && users && users.length > 0) {
        const user = users[0];
        // Check password hash
        if (user.password_hash === password_hash) {
          foundUser = user;
        }
      }
    } catch (e) {
      console.warn('Supabase users table lookup failed:', e);
    }

    // 2. Fallback: hardcoded test accounts (for initial setup)
    if (!foundUser) {
      const testUsers = [
        { id: 1, username: 'admin', password: 'admin123', role: 'admin', full_name: 'Administrateur', email: 'admin@stock.dz', business_units: [] },
        { id: 2, username: 'manager', password: 'manager123', role: 'manager', full_name: 'Manager', email: 'manager@stock.dz', business_units: [] },
        { id: 3, username: 'user', password: 'user123', role: 'user', full_name: 'Utilisateur', email: 'user@stock.dz', business_units: [] }
      ];
      const testUser = testUsers.find(u =>
        (u.username === username || u.email === username) && u.password === password
      );
      if (testUser) {
        foundUser = { ...testUser, password_hash: null };
      }
    }

    if (!foundUser) {
      return NextResponse.json({ success: false, error: 'Identifiants incorrects' }, { status: 401 });
    }

    // Generate token
    const token = Buffer.from(`${foundUser.username}:${Date.now()}`).toString('base64');

    // Fetch available business units
    let businessUnits: any[] = [];
    try {
      const { data: buData } = await sb
        .from('business_units')
        .select('schema_name, bu_code, year, nom_entreprise')
        .eq('active', true)
        .order('year', { ascending: false });
      businessUnits = buData || [];
    } catch { /* non critique */ }

    // Filter BUs by user permissions (admin sees all)
    const userBUs = foundUser.role === 'admin'
      ? businessUnits
      : businessUnits.filter(bu =>
          (foundUser.business_units || []).includes(bu.schema_name)
        );

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: foundUser.id,
        username: foundUser.username,
        email: foundUser.email,
        nom: foundUser.full_name || foundUser.nom || foundUser.username,
        role: foundUser.role,
        business_units: foundUser.role === 'admin'
          ? businessUnits.map((bu: any) => bu.schema_name)
          : (foundUser.business_units || [])
      },
      businessUnits: userBUs
    });

  } catch (error: any) {
    console.error('Error in login:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
