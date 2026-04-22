import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const days = request.nextUrl.searchParams.get('days') || '30';

  // Try backend first if configured
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/overdue?days=${days}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[overdue] Backend unavailable, using Supabase direct');
    }
  }

  // Direct Supabase fallback
  try {
    if (!supabaseAdmin || !tenant || dbType !== 'supabase') {
      return NextResponse.json({ success: true, data: [] });
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));
    const cutoff = cutoffDate.toISOString().split('T')[0];

    // Get overdue BL (delivery notes with unpaid balance, net of avoirs)
    const { data: blData } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT 
          b."NFact" as document_ref,
          'delivery_note' as document_type,
          b."Nclient" as nclient,
          c."Raison_sociale" as client_name,
          b.montant_ht + b."TVA" as total_amount,
          COALESCE((
            SELECT SUM(p.amount) FROM public.payments p
            WHERE p.document_id::text = b."NFact"::text 
              AND p.document_type = 'delivery_note'
              AND p.tenant_id = '${tenant}'
          ), 0) as paid_amount,
          COALESCE((
            SELECT SUM(a.montant_ttc) FROM public.avoir a
            WHERE a.document_ref::text = b."NFact"::text 
              AND a.document_type = 'bl'
              AND a.tenant = '${tenant}'
          ), 0) as avoir_amount,
          b.date_fact as document_date
        FROM "${tenant}".bl b
        LEFT JOIN "${tenant}".client c ON b."Nclient" = c."Nclient"
        WHERE b.date_fact <= '${cutoff}'
        ORDER BY b.date_fact ASC
        LIMIT 200;
      `
    });

    const results = (blData || []).map((row: any) => ({
      document_ref: row.document_ref,
      document_type: row.document_type,
      nclient: row.nclient,
      client_name: row.client_name,
      total_amount: parseFloat(row.total_amount || 0),
      paid_amount: parseFloat(row.paid_amount || 0),
      avoir_amount: parseFloat(row.avoir_amount || 0),
      // Net balance = total - paid - avoirs
      remaining: Math.max(0, parseFloat(row.total_amount || 0) - parseFloat(row.paid_amount || 0) - parseFloat(row.avoir_amount || 0)),
      document_date: row.document_date,
      days_overdue: Math.floor((Date.now() - new Date(row.document_date).getTime()) / 86400000)
    })).filter((r: any) => r.remaining > 0.01);

    return NextResponse.json({ success: true, data: results, source: 'supabase_direct' });
  } catch (error) {
    console.error('❌ overdue direct error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur' }, { status: 500 });
  }
}
