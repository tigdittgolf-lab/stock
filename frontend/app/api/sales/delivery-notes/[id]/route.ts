import { NextRequest, NextResponse } from 'next/server';
import { readTableById, readTableWhere } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  const numericId = parseInt(id);
  if (!id || isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ success: false, error: `ID BL invalide: ${id}` }, { status: 400 });
  }

  // 1. Backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${numericId}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[delivery-notes/id] Backend unavailable'); }
  }

  // 2. Supabase direct
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    const bl = await readTableById(tenant, 'bl', numericId);
    if (!bl) return NextResponse.json({ success: false, error: `BL ${numericId} introuvable` }, { status: 404 });

    // Charger les détails
    let details: any[] = [];
    try {
      details = await readTableWhere(tenant, 'detail_bl', 'nfact', numericId);
      if (details.length === 0) {
        details = await readTableWhere(tenant, 'detail_bl', 'nbl', numericId);
      }
    } catch { /* pas de détails */ }

    return NextResponse.json({ success: true, data: { ...bl, detail_bl: details }, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${id}`, {
        method: 'DELETE',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      return NextResponse.json(await res.json(), { status: res.status });
    } catch { console.warn('[delivery-notes DELETE] Backend unavailable'); }
  }
  return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
}
