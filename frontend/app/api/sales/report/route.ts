import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';
  const { searchParams } = new URL(request.url);
  const dateFrom = searchParams.get('dateFrom') || '';
  const dateTo = searchParams.get('dateTo') || '';
  const type = searchParams.get('type') || 'ALL'; // ALL | BL | FACTURE
  const clientCode = searchParams.get('clientCode') || '';

  // 1. Try backend
  if (process.env.BACKEND_URL) {
    try {
      const qs = new URLSearchParams({ dateFrom, dateTo, type, ...(clientCode ? { clientCode } : {}) });
      const res = await fetch(`${process.env.BACKEND_URL}/api/sales/report?${qs}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(10000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: true, data: { sales: [], totals: null } });
  }

  try {
    const sales: any[] = [];

    // Helper to normalize a row
    const fv = (r: any, ...names: string[]) => {
      const keys = Object.keys(r);
      for (const n of names) {
        const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
        if (k !== undefined && r[k] !== null && r[k] !== undefined) return r[k];
      }
      return undefined;
    };

    // Load BL (delivery notes)
    if (type === 'ALL' || type === 'BL') {
      try {
        const blRows = await readTable(tenant, 'bl');
        for (const r of blRows) {
          const date = fv(r, 'date_fact', 'date_bl', 'date') || '';
          if (dateFrom && date < dateFrom) continue;
          if (dateTo && date > dateTo) continue;
          const nclient = String(fv(r, 'nclient', 'Nclient') || '');
          if (clientCode && nclient !== clientCode) continue;
          const nfact = fv(r, 'nfact', 'nbl', 'NFact', 'id');
          const montant_ht = parseFloat(fv(r, 'montant_ht', 'mht') || 0);
          const tva = parseFloat(fv(r, 'tva', 'TVA', 'montant_tva') || 0);
          const montant_ttc = parseFloat(fv(r, 'montant_ttc', 'total_ttc') || 0) || (montant_ht + tva);
          const marge = parseFloat(fv(r, 'marge') || 0);
          sales.push({
            type: 'BL',
            numero: nfact,
            date,
            client_code: nclient,
            client_name: fv(r, 'client_name', 'raison_sociale', 'nom') || nclient,
            montant_ht,
            tva,
            montant_ttc,
            marge,
            marge_percentage: montant_ht > 0 ? Math.round((marge / montant_ht) * 100) : 0,
          });
        }
      } catch { /* table may not exist */ }
    }

    // Load Factures
    if (type === 'ALL' || type === 'FACTURE') {
      for (const tbl of ['fact', 'facture']) {
        try {
          const factRows = await readTable(tenant, tbl);
          if (factRows.length === 0) continue;
          for (const r of factRows) {
            const date = fv(r, 'date_fact', 'date') || '';
            if (dateFrom && date < dateFrom) continue;
            if (dateTo && date > dateTo) continue;
            const nclient = String(fv(r, 'nclient', 'Nclient') || '');
            if (clientCode && nclient !== clientCode) continue;
            const nfact = fv(r, 'nfact', 'NFact', 'id');
            const montant_ht = parseFloat(fv(r, 'montant_ht', 'mht') || 0);
            const tva = parseFloat(fv(r, 'tva', 'TVA', 'montant_tva') || 0);
            const montant_ttc = parseFloat(fv(r, 'montant_ttc', 'total_ttc') || 0) || (montant_ht + tva);
            const marge = parseFloat(fv(r, 'marge') || 0);
            sales.push({
              type: 'FACTURE',
              numero: nfact,
              date,
              client_code: nclient,
              client_name: fv(r, 'client_name', 'raison_sociale', 'nom') || nclient,
              montant_ht,
              tva,
              montant_ttc,
              marge,
              marge_percentage: montant_ht > 0 ? Math.round((marge / montant_ht) * 100) : 0,
            });
          }
          break; // found data, stop trying
        } catch { /* try next */ }
      }
    }

    // Load avoirs to deduct from totals
    let totalAvoirs = 0;
    try {
      const avoirRes = await fetch(
        `${SUPABASE_URL}/rest/v1/avoir?tenant=eq.${tenant}&select=montant_ttc,date_avoir`,
        { headers: { 'apikey': SUPABASE_SERVICE_KEY, 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`, 'Accept': 'application/json' } }
      );
      if (avoirRes.ok) {
        const avoirs = await avoirRes.json();
        totalAvoirs = (avoirs || [])
          .filter((a: any) => {
            const d = a.date_avoir || '';
            return (!dateFrom || d >= dateFrom) && (!dateTo || d <= dateTo);
          })
          .reduce((s: number, a: any) => s + parseFloat(a.montant_ttc || 0), 0);
      }
    } catch { /* non critique */ }

    // Sort by date desc
    sales.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    // Calculate totals
    const count_bl = sales.filter(s => s.type === 'BL').length;
    const count_factures = sales.filter(s => s.type === 'FACTURE').length;
    const total_ht = sales.reduce((s, r) => s + r.montant_ht, 0);
    const total_tva = sales.reduce((s, r) => s + r.tva, 0);
    const total_ttc = sales.reduce((s, r) => s + r.montant_ttc, 0);
    const total_marge = sales.reduce((s, r) => s + r.marge, 0);

    return NextResponse.json({
      success: true,
      data: {
        sales,
        totals: {
          count_bl,
          count_factures,
          total_count: sales.length,
          total_ht: Math.round(total_ht * 100) / 100,
          total_tva: Math.round(total_tva * 100) / 100,
          total_ttc: Math.round(total_ttc * 100) / 100,
          total_marge: Math.round(total_marge * 100) / 100,
          marge_percentage_avg: total_ht > 0 ? Math.round((total_marge / total_ht) * 100 * 10) / 10 : 0,
          total_avoirs: Math.round(totalAvoirs * 100) / 100,
          net_ttc: Math.round((total_ttc - totalAvoirs) * 100) / 100,
        }
      },
      source: 'supabase_direct'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
