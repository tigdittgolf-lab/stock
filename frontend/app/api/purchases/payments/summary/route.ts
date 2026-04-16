import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// GET /api/purchases/payments/summary
// Returns { "purchase_delivery_note::123": totalPaid, ... }
export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  // 1. Try backend
  if (process.env.BACKEND_URL) {
    try {
      const res = await fetch(`${process.env.BACKEND_URL}/api/purchases/payments/summary`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  // 2. Supabase direct — payments table is in public schema
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: true, data: {} });
  }

  try {
    // Fetch purchase payments for this tenant
    const url = `${SUPABASE_URL}/rest/v1/payments?tenant_id=eq.${tenant}&document_type=in.(purchase_delivery_note,purchase_invoice)&select=document_type,document_id,amount`;
    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: {}, source: 'empty_fallback' });
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
    console.error('❌ [purchases/payments/summary]', msg);
    // Return empty map so UI degrades gracefully
    return NextResponse.json({ success: true, data: {}, source: 'empty_fallback' });
  }
}
