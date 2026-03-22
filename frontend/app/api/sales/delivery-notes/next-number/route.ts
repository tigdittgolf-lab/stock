import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
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
    } catch { /* fallback */ }
  }

  // 2. Supabase direct — get max(nbl) or max(nfact) from bl table
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    // Try nbl column first, then nfact
    for (const col of ['nbl', 'nfact']) {
      const url = `${SUPABASE_URL}/rest/v1/bl?select=${col}&order=${col}.desc&limit=1`;
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Accept-Profile': tenant,
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(6000),
      });

      if (!res.ok) continue;

      const rows = await res.json();
      if (Array.isArray(rows) && rows.length > 0 && rows[0][col] != null) {
        const maxNum = parseInt(rows[0][col]);
        if (!isNaN(maxNum)) {
          return NextResponse.json({
            success: true,
            data: { next_number: maxNum + 1 }
          });
        }
      }
    }

    // Fallback: table empty or columns not found
    return NextResponse.json({ success: true, data: { next_number: 1 } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('❌ [next-number]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
