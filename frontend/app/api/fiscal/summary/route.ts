import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;

/**
 * GET /api/fiscal/summary?month=YYYY-MM
 * Calcule TVA collectée, TVA déductible, TAP depuis les factures ventes/achats
 */
export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month') || new Date().toISOString().slice(0, 7); // YYYY-MM

  const [year, mon] = month.split('-');
  const startDate = `${year}-${mon}-01`;
  const endDate = new Date(parseInt(year), parseInt(mon), 0).toISOString().slice(0, 10); // last day

  // Try backend first
  if (BACKEND_URL) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/fiscal/summary?month=${month}`,
        {
          headers: { 'X-Tenant': tenant },
          signal: AbortSignal.timeout(8000)
        }
      );
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[fiscal/summary] Backend unavailable, using Supabase direct');
    }
  }

  // Fallback: direct Supabase RPC
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Sales invoices TVA collectée
    const { data: salesInvoices } = await supabase.rpc('get_all_table_data', {
      p_schema_name: tenant,
      p_table_name: 'facture'
    });

    // Sales BL TVA collectée
    const { data: salesBL } = await supabase.rpc('get_all_table_data', {
      p_schema_name: tenant,
      p_table_name: 'bl'
    });

    // Purchase invoices TVA déductible
    const { data: purchaseInvoices } = await supabase.rpc('get_all_table_data', {
      p_schema_name: tenant,
      p_table_name: 'facture_achat'
    });

    const filterByMonth = (rows: any[], dateField: string) =>
      (rows || []).filter((r: any) => {
        const d = r[dateField] || r.date_fact || r.Date_fact;
        return d && d >= startDate && d <= endDate;
      });

    const sumField = (rows: any[], field: string) =>
      rows.reduce((acc: number, r: any) => acc + parseFloat(r[field] || r[field.toLowerCase()] || 0), 0);

    const filteredSalesInv = filterByMonth(salesInvoices || [], 'date_fact');
    const filteredSalesBL = filterByMonth(salesBL || [], 'date_fact');
    const filteredPurchases = filterByMonth(purchaseInvoices || [], 'date_fact');

    const ca_ht_factures = sumField(filteredSalesInv, 'montant_ht');
    const ca_ht_bl = sumField(filteredSalesBL, 'montant_ht');
    const ca_ht_total = ca_ht_factures + ca_ht_bl;

    const tva_collectee_factures = sumField(filteredSalesInv, 'tva');
    const tva_collectee_bl = sumField(filteredSalesBL, 'tva');
    const tva_collectee = tva_collectee_factures + tva_collectee_bl;

    const tva_deductible = sumField(filteredPurchases, 'tva');
    const tva_nette = Math.max(0, tva_collectee - tva_deductible);

    return NextResponse.json({
      success: true,
      data: {
        month,
        period: { start: startDate, end: endDate },
        sales: {
          ca_ht_factures,
          ca_ht_bl,
          ca_ht_total,
          tva_collectee,
          nb_factures: filteredSalesInv.length,
          nb_bl: filteredSalesBL.length
        },
        purchases: {
          total_ht: sumField(filteredPurchases, 'montant_ht'),
          tva_deductible,
          nb_factures: filteredPurchases.length
        },
        tva: {
          collectee: tva_collectee,
          deductible: tva_deductible,
          nette_a_payer: tva_nette
        },
        tap: {
          base_ca_ht: ca_ht_total,
          // TAP rate applied from settings — frontend will multiply
          base: ca_ht_total
        }
      }
    });
  } catch (error) {
    console.error('❌ fiscal/summary error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
