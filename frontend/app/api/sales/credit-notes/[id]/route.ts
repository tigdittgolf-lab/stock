import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const tenant = request.headers.get('X-Tenant') || '';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  // Essayer le backend d'abord
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/credit-notes/${id}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch {
      console.warn('[credit-notes/:id] Backend unavailable, using Supabase direct');
    }
  }

  // Fallback Supabase direct
  try {
    if (dbType !== 'supabase') return NextResponse.json({ success: false, error: 'Avoir introuvable' }, 404);

    const avoirRes = await fetch(
      `${SUPABASE_URL}/rest/v1/avoir?id=eq.${id}&tenant=eq.${tenant}&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const avoirs = await avoirRes.json();
    if (!avoirs?.[0]) return NextResponse.json({ success: false, error: 'Avoir introuvable' }, 404);

    const detailsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/detail_avoir?avoir_id=eq.${id}&select=*`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    );
    const details = await detailsRes.json();

    return NextResponse.json({ success: true, data: { ...avoirs[0], details: details || [] } });
  } catch (error) {
    console.error('❌ credit-notes/:id error:', error);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
