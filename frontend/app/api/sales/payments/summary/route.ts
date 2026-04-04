import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/sales/payments/summary
// Returns a map { "delivery_note::123": totalPaid, ... } in ONE request
export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  // 1. Try backend
  if (process.env.BACKEND_URL) {
    try {
      const response = await fetch(`${process.env.BACKEND_URL}/api/sales/payments/summary`, {
        headers: {
          'X-Tenant': tenant,
          'X-Database-Type': dbType,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        signal: AbortSignal.timeout(5000)
      });
      if (response.ok) return NextResponse.json(await response.json());
      // Backend error — fall through to Supabase
    } catch { /* network error — fall through */ }
  }

  // 2. Supabase direct — payments table is in public schema
  try {
    // Fetch all payments for this tenant from public.payments
    const url = `${SUPABASE_URL}/rest/v1/payments?tenant_id=eq.${tenant}&select=document_type,document_id,amount`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: `Supabase error: ${err}` }, { status: 500 });
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) {
      return NextResponse.json({ success: true, data: {} });
    }

    // Build map: "document_type::document_id" -> total_paid
    const payMap: Record<string, number> = {};
    for (const row of rows) {
      const key = `${row.document_type}::${row.document_id}`;
      payMap[key] = (payMap[key] || 0) + parseFloat(row.amount || '0');
    }

    return NextResponse.json({ success: true, data: payMap, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('❌ [payments/summary]', msg);
    // Return empty map so the UI degrades gracefully
    return NextResponse.json({ success: true, data: {}, source: 'empty_fallback' });
  }
}
