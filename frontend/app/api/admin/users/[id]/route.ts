import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });

    const sb = getSupabase();
    const { data, error } = await sb.from('users').select('*').eq('id', userId).single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 404 });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });

    const body = await request.json();
    const updateData: any = {
      username: body.username,
      email: body.email,
      full_name: body.full_name,
      role: body.role,
      business_units: body.business_units,
      active: body.active,
      updated_at: new Date().toISOString()
    };

    if (body.password?.trim()) {
      const crypto = require('crypto');
      updateData.password_hash = crypto.createHash('sha256').update(body.password).digest('hex');
    }

    const sb = getSupabase();
    const { data, error } = await sb.from('users').update(updateData).eq('id', userId).select().single();
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, data, message: 'Utilisateur mis à jour avec succès' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id);
    if (isNaN(userId)) return NextResponse.json({ success: false, error: 'ID invalide' }, { status: 400 });

    const sb = getSupabase();
    const { error } = await sb.from('users').delete().eq('id', userId);
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    return NextResponse.json({ success: true, message: 'Utilisateur supprimé avec succès' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur interne' }, { status: 500 });
  }
}
