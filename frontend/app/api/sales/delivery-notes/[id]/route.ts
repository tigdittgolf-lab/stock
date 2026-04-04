import { NextRequest, NextResponse } from 'next/server';
import { readTableById, readTableWhere, readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  const numericId = parseInt(id);
  if (!id || isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ success: false, error: `ID BL invalide: ${id}` }, { status: 400 });
  }

  // 1. Backend (short timeout)
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${numericId}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      // Backend error — fall through to Supabase
    } catch { /* network error — fall through */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    // Use RPC which handles case-insensitive column names
    const bl = await readTableById(tenant, 'bl', numericId);
    if (!bl) {
      return NextResponse.json({ success: false, error: `BL ${numericId} introuvable` }, { status: 404 });
    }

    // Load detail_bl — try nfact then nbl
    let detailRows: any[] = [];
    for (const col of ['nfact', 'nbl', 'NFact']) {
      try {
        detailRows = await readTableWhere(tenant, 'detail_bl', col, numericId);
        if (detailRows.length > 0) break;
      } catch { /* try next */ }
    }

    const keys = Object.keys(bl);
    const findVal = (...names: string[]) => {
      for (const n of names) {
        const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
        if (k !== undefined && bl[k] !== null && bl[k] !== undefined) return bl[k];
      }
      return undefined;
    };

    const normalized = {
      ...bl,
      nbl: findVal('nbl', 'nfact', 'id'),
      nfact: findVal('nfact', 'nbl', 'id'),
      nclient: findVal('nclient', 'ncli', 'code_client'),
      client_name: findVal('client_name', 'raison_sociale', 'nom', 'client'),
      date_fact: findVal('date_fact', 'date_bl', 'date'),
      date_bl: findVal('date_bl', 'date_fact', 'date'),
      montant_ht: findVal('montant_ht', 'mht', 'total_ht'),
      tva: findVal('tva', 'montant_tva', 'taxe'),
      montant_ttc: findVal('montant_ttc', 'total_ttc', 'mttc'),
    };

    const details = detailRows.map((d: any) => {
      const dk = Object.keys(d);
      const dFind = (...names: string[]) => {
        for (const n of names) {
          const k = dk.find(k => k.toLowerCase() === n.toLowerCase());
          if (k !== undefined && d[k] !== null && d[k] !== undefined) return d[k];
        }
        return undefined;
      };
      return {
        ...d,
        narticle: dFind('narticle', 'article', 'code_article', 'ref'),
        designation: dFind('designation', 'libelle', 'nom_article', 'description'),
        qte: dFind('qte', 'quantite', 'qty'),
        prix: dFind('prix', 'prix_unitaire', 'pu', 'prix_vente'),
        tva: dFind('tva', 'taux_tva', 'taxe'),
        total_ligne: dFind('total_ligne', 'montant_ligne', 'total', 'montant'),
      };
    });

    return NextResponse.json({
      success: true,
      data: { ...normalized, details, detail_bl: details },
      source: 'supabase_rpc'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error(`❌ [delivery-notes/${numericId}]`, msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${id}`, {
        method: 'DELETE',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      return NextResponse.json(await res.json(), { status: res.status });
    } catch { console.warn('[delivery-notes DELETE] Backend unavailable'); }
  }
  return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
}
