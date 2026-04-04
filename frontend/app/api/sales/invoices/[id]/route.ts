import { NextRequest, NextResponse } from 'next/server';
import { readTable, readTableById, readTableWhere } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  const numericId = parseInt(id);
  if (!id || isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ success: false, error: `ID facture invalide: ${id}` }, { status: 400 });
  }

  // 1. Backend — fallback on any error
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices/${numericId}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(4000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      // Backend error — fall through to Supabase
    } catch { /* network error — fall through */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    // Try facture then fact (same as ?id= route)
    let fact: any = null;
    for (const tbl of ['facture', 'fact']) {
      try { fact = await readTableById(tenant, tbl, numericId); if (fact) break; } catch { /* try next */ }
    }
    if (!fact) {
      return NextResponse.json({ success: false, error: `Facture ${numericId} introuvable` }, { status: 404 });
    }

    // Details — try multiple table and column name variants
    let detailRows: any[] = [];
    for (const tbl of ['detail_fact', 'detail_facture']) {
      for (const col of ['nfact', 'NFact', 'Nfact', 'nbl', 'id_fact']) {
        try {
          detailRows = await readTableWhere(tenant, tbl, col, numericId);
          if (detailRows.length > 0) break;
        } catch {}
      }
      if (detailRows.length > 0) break;
    }

    // Fallback: load full table and filter (handles any column casing)
    if (detailRows.length === 0) {
      for (const tbl of ['detail_fact', 'detail_facture']) {
        try {
          const allRows = await readTable(tenant, tbl);
          const filtered = allRows.filter((r: any) => {
            const keys = Object.keys(r);
            for (const candidate of ['nfact', 'nbl', 'id_fact']) {
              const k = keys.find(k => k.toLowerCase() === candidate);
              if (k && Number(r[k]) === numericId) return true;
            }
            return false;
          });
          if (filtered.length > 0) { detailRows = filtered; break; }
        } catch {}
      }
    }

    const keys = Object.keys(fact);
    const fv = (...names: string[]) => {
      for (const n of names) {
        const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
        if (k !== undefined && fact[k] !== null && fact[k] !== undefined) return fact[k];
      }
      return undefined;
    };

    const normalized: any = {
      ...fact,
      nfact: fv('nfact', 'id'),
      nclient: fv('nclient', 'ncli', 'code_client'),
      client_name: fv('client_name', 'raison_sociale', 'nom', 'client'),
      date_fact: fv('date_fact', 'date'),
      montant_ht: fv('montant_ht', 'mht', 'total_ht'),
      tva: fv('tva', 'montant_tva'),
      montant_ttc: fv('montant_ttc', 'total_ttc', 'mttc'),
      timbre: fv('timbre') || 0,
    };

    // Enrich client data
    if (normalized.nclient) {
      try {
        const clientRows = await readTable(tenant, 'client');
        const found = clientRows.find((c: any) => {
          const ck = Object.keys(c).find(k => k.toLowerCase() === 'nclient');
          return ck && String(c[ck]) === String(normalized.nclient);
        });
        if (found) {
          const ck = Object.keys(found);
          const cv = (...names: string[]) => { for (const n of names) { const k = ck.find(k => k.toLowerCase() === n.toLowerCase()); if (k && found[k]) return found[k]; } return ''; };
          normalized.client_name = normalized.client_name || cv('raison_sociale', 'nom');
          normalized.client = {
            raison_sociale: cv('raison_sociale', 'nom'),
            adresse: cv('adresse', 'address'),
            telephone: cv('telephone', 'tel', 'phone'),
            nif: cv('nif', 'ident_fiscal'),
            rc: cv('rc', 'nrc'),
            art: cv('art', 'nart'),
          };
        }
      } catch { /* non critique */ }
    }

    const details = detailRows.map((d: any) => {
      const dk = Object.keys(d);
      const dv = (...names: string[]) => { for (const n of names) { const k = dk.find(k => k.toLowerCase() === n.toLowerCase()); if (k !== undefined && d[k] !== null && d[k] !== undefined) return d[k]; } return undefined; };
      return {
        ...d,
        narticle: dv('narticle', 'article', 'ref'),
        designation: dv('designation', 'libelle', 'nom_article'),
        qte: dv('qte', 'quantite', 'qty'),
        prix: dv('prix', 'prix_unitaire', 'pu'),
        tva: dv('tva', 'taux_tva'),
        total_ligne: dv('total_ligne', 'montant_ligne', 'total'),
      };
    });

    return NextResponse.json({
      success: true,
      data: { ...normalized, details, detail_fact: details },
      source: 'supabase_rpc'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error(`❌ [invoices/${numericId}]`, msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
