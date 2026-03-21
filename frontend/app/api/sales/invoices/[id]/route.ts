import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

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

  // 1. Backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices/${numericId}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[invoices/id] Backend unavailable'); }
  }

  // 2. Supabase direct
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    const rows = await readTable(tenant, 'facture');
    const facture = rows.find((r: any) => r.nfact == numericId);
    if (!facture) return NextResponse.json({ success: false, error: `Facture ${numericId} introuvable` }, { status: 404 });

    // Charger les détails
    let details: any[] = [];
    try {
      const detailRows = await readTable(tenant, 'detail_fact');
      details = detailRows.filter((d: any) => d.nfact == numericId);
    } catch { /* pas de détails */ }

    return NextResponse.json({ success: true, data: { ...facture, detail_fact: details }, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
