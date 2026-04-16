import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function GET(request: NextRequest) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      debug: { count: data?.length || 0 }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.username || !body.email || !body.password) {
      return NextResponse.json({ success: false, error: 'Username, email et password sont requis' }, { status: 400 });
    }

    const crypto = require('crypto');
    const password_hash = crypto.createHash('sha256').update(body.password).digest('hex');

    const userData = {
      username: body.username,
      email: body.email,
      password_hash,
      full_name: body.full_name || '',
      role: body.role || 'user',
      business_units: body.business_units || [],
      active: true
    };

    const sb = getSupabase();
    const { data, error } = await sb.from('users').insert([userData]).select().single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, data, message: 'Utilisateur créé avec succès' });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
