import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  // 1. Try backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/next-number`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      // Backend returned error — fall through to Supabase
    } catch { /* network error — fall through to Supabase */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    const rows = await readTable(tenant, 'bl');

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: true, data: { next_number: 1 } });
    }

    // Find the actual column name (case-insensitive)
    const keys = Object.keys(rows[0]);
    const colName = keys.find(k => k.toLowerCase() === 'nbl') ||
                    keys.find(k => k.toLowerCase() === 'nfact') ||
                    keys.find(k => k.toLowerCase() === 'id');

    if (!colName) {
      return NextResponse.json({ success: true, data: { next_number: rows.length + 1 } });
    }

    const maxNum = rows.reduce((max: number, r: any) => {
      const val = parseInt(r[colName]);
      return isNaN(val) ? max : Math.max(max, val);
    }, 0);

    return NextResponse.json({ success: true, data: { next_number: maxNum + 1 } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('❌ [next-number]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
