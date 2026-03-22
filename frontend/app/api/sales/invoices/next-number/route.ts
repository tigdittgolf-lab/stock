import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices/next-number`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fallback */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: true, data: { next_number: null } });
  }

  try {
    let rows: any[] = [];
    for (const tbl of ['facture', 'fact']) {
      try { rows = await readTable(tenant, tbl); if (rows.length > 0) break; } catch { /* continuer */ }
    }
    if (rows.length === 0) return NextResponse.json({ success: true, data: { next_number: 1 } });

    const maxId = rows.reduce((max: number, r: any) => {
      const keys = Object.keys(r);
      const k = keys.find(k => k.toLowerCase() === 'nfact');
      const val = k ? parseInt(r[k]) : 0;
      return val > max ? val : max;
    }, 0);

    return NextResponse.json({ success: true, data: { next_number: maxId + 1 } });
  } catch {
    return NextResponse.json({ success: true, data: { next_number: null } });
  }
}
