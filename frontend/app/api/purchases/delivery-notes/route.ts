import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  // 1. Try backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/purchases/delivery-notes`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: true, data: [], source: 'empty' });
  }

  try {
    // Try RPC get_purchase_delivery_notes first
    try {
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_purchase_delivery_notes`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_tenant: tenant }),
        signal: AbortSignal.timeout(8000),
      });
      if (rpcRes.ok) {
        const result = await rpcRes.json();
        const data = Array.isArray(result) ? result : (result ? [result] : []);
        if (data.length > 0) {
          return NextResponse.json({ success: true, data, source: 'supabase_rpc' });
        }
      }
    } catch { /* try readTable */ }

    // Fallback: readTable — try bachat first (old schema), then bl_achat (new schema)
    let rows: any[] = [];
    let tableName = '';
    for (const tbl of ['bachat', 'bl_achat', 'bl_fournisseur']) {
      try {
        const r = await readTable(tenant, tbl);
        if (r.length > 0) { rows = r; tableName = tbl; break; }
      } catch { /* try next */ }
    }

    if (rows.length === 0) {
      return NextResponse.json({ success: true, data: [], source: 'empty' });
    }

    const sampleKeys = Object.keys(rows[0]);
    const fv = (r: any, ...names: string[]) => {
      for (const n of names) {
        const k = sampleKeys.find(k => k.toLowerCase() === n.toLowerCase());
        if (k && r[k] != null) return r[k];
      }
      return undefined;
    };

    const data = rows.map((r: any) => {
      const nfact = fv(r, 'nfact', 'nbl_achat', 'id');
      const nfournisseur = String(fv(r, 'nfournisseur', 'supplier_code') || '');
      const montant_ht = parseFloat(fv(r, 'montant_ht', 'mht') || 0);
      const tva = parseFloat(fv(r, 'tva', 'montant_tva') || 0);
      return {
        nbl_achat: nfact,
        nfact,
        nfournisseur,
        supplier_name: fv(r, 'supplier_name', 'nom_fournisseur') || nfournisseur,
        numero_bl_fournisseur: fv(r, 'numero_bl_fournisseur', 'num_bl', 'reference', 'nfact') || String(nfact || ''),
        date_bl: fv(r, 'date_bl', 'date_fact', 'date') || '',
        montant_ht,
        tva,
        total_ttc: parseFloat(fv(r, 'total_ttc', 'montant_ttc', 'mttc') || 0) || (montant_ht + tva),
      };
    });

    // Enrich supplier names from fournisseur table
    const needsName = data.filter((d: any) => !d.supplier_name || d.supplier_name === d.nfournisseur);
    if (needsName.length > 0) {
      try {
        const fournRows = await readTable(tenant, 'fournisseur');
        const fournMap: Record<string, string> = {};
        fournRows.forEach((f: any) => {
          const fk = Object.keys(f);
          const getF = (...names: string[]) => {
            for (const n of names) {
              const k = fk.find(k => k.toLowerCase() === n.toLowerCase());
              if (k && f[k]) return f[k];
            }
            return '';
          };
          const code = String(getF('nfournisseur', 'code') || '').trim();
          const name = getF('nom_fournisseur', 'nom', 'raison_sociale');
          if (code) fournMap[code] = name;
        });
        data.forEach((d: any) => {
          if ((!d.supplier_name || d.supplier_name === d.nfournisseur) && d.nfournisseur) {
            d.supplier_name = fournMap[String(d.nfournisseur).trim()] || d.nfournisseur;
          }
        });
      } catch { /* non critique */ }
    }

    return NextResponse.json({ success: true, data, source: `supabase_${tableName}` });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400')) {
      return NextResponse.json({ success: true, data: [], source: 'empty' });
    }
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/purchases/delivery-notes`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  return NextResponse.json({ success: false, error: 'Backend non disponible pour la création' }, { status: 503 });
}
