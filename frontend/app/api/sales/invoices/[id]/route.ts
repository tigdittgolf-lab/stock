import { NextRequest, NextResponse } from 'next/server';
import { readTableById, readTableWhere } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

const schemaError = (msg: string) =>
  msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422');

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  const numericId = parseInt(id);
  if (!id || isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ success: false, error: `ID facture invalide: ${id}` }, { status: 400 });
  }

  // 1. Backend (MySQL, PostgreSQL, ou Supabase via backend)
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices/${numericId}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[invoices/id] Backend ${res.status}, fallback Supabase`);
    } catch { console.warn('[invoices/id] Backend unavailable'); }
  }

  // 2. Supabase direct uniquement
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible pour MySQL/PostgreSQL' }, { status: 503 });
  }

  try {
    const facture = await readTableById(tenant, 'facture', numericId);
    if (!facture) return NextResponse.json({ success: false, error: `Facture ${numericId} introuvable` }, { status: 404 });

    let details: any[] = [];
    try {
      details = await readTableWhere(tenant, 'detail_fact', 'nfact', numericId);
    } catch { /* pas de détails */ }

    return NextResponse.json({ success: true, data: { ...facture, detail_fact: details }, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (schemaError(msg)) return NextResponse.json({ success: false, error: `Schéma ${tenant} introuvable` }, { status: 404 });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
