import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const documentType = searchParams.get('documentType') || '';

  // 1. Try backend
  if (process.env.BACKEND_URL) {
    try {
      const qs = new URLSearchParams({ dateFrom, dateTo, ...(documentType ? { documentType } : {}) });
      const res = await fetch(`${process.env.BACKEND_URL}/api/sales/payments/report?${qs}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  // 2. Supabase direct — payments table is in public schema
  try {
    let url = `${SUPABASE_URL}/rest/v1/payments?tenant_id=eq.${tenant}&select=*`;
    if (dateFrom) url += `&payment_date=gte.${dateFrom}`;
    if (dateTo) url += `&payment_date=lte.${dateTo}`;
    if (documentType) url += `&document_type=eq.${documentType}`;

    const res = await fetch(url, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: `Supabase error: ${err}` }, { status: 500 });
    }

    const payments: any[] = await res.json();

    // Build statistics
    const byType: Record<string, { count: number; amount: number }> = {};
    const byMethod: Record<string, { count: number; amount: number }> = {};
    const byMonth: Record<string, { count: number; amount: number }> = {};
    let totalAmount = 0;

    for (const p of payments) {
      const amount = parseFloat(p.amount || '0');
      totalAmount += amount;

      // by_type
      const dt = p.document_type || 'unknown';
      if (!byType[dt]) byType[dt] = { count: 0, amount: 0 };
      byType[dt].count++;
      byType[dt].amount += amount;

      // by_method
      const method = p.payment_method || 'unknown';
      if (!byMethod[method]) byMethod[method] = { count: 0, amount: 0 };
      byMethod[method].count++;
      byMethod[method].amount += amount;

      // by_month
      const month = (p.payment_date || '').slice(0, 7); // YYYY-MM
      if (month) {
        if (!byMonth[month]) byMonth[month] = { count: 0, amount: 0 };
        byMonth[month].count++;
        byMonth[month].amount += amount;
      }
    }

    // Also fetch avoirs (credit notes) for the same period
    let avoirs: any[] = [];
    try {
      let avoirUrl = `${SUPABASE_URL}/rest/v1/avoir?tenant=eq.${tenant}&select=*`;
      if (dateFrom) avoirUrl += `&date_avoir=gte.${dateFrom}`;
      if (dateTo) avoirUrl += `&date_avoir=lte.${dateTo}`;
      const avoirRes = await fetch(avoirUrl, {
        headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Accept': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (avoirRes.ok) avoirs = await avoirRes.json();
    } catch { /* non critique */ }

    const totalAvoirs = avoirs.reduce((s: number, a: any) => s + parseFloat(a.montant_ttc || 0), 0);

    return NextResponse.json({
      success: true,
      data: {
        payments,
        avoirs,
        statistics: {
          total_payments: payments.length,
          total_amount: totalAmount,
          total_avoirs: avoirs.length,
          total_avoirs_amount: totalAvoirs,
          net_amount: totalAmount - totalAvoirs,  // paiements nets après avoirs
          by_type: byType,
          by_method: byMethod,
          by_month: byMonth,
        }
      },
      source: 'supabase_direct'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('❌ [payments/report]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
