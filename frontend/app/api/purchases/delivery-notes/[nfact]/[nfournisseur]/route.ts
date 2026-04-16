import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nfact: string; nfournisseur: string }> }
) {
  const { nfact, nfournisseur } = await params;
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  // 1. Try backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/purchases/delivery-notes/${encodeURIComponent(nfact)}/${encodeURIComponent(nfournisseur)}`,
        {
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
          signal: AbortSignal.timeout(6000),
        }
      );
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    // Try bachat then bl_achat
    let blRow: any = null;
    let detailRows: any[] = [];

    for (const tbl of ['bachat', 'bl_achat']) {
      try {
        const rows = await readTable(tenant, tbl);
        const found = rows.find((r: any) => {
          const rk = Object.keys(r);
          const getNfact = rk.find(k => k.toLowerCase() === 'nfact');
          const getNfourn = rk.find(k => k.toLowerCase() === 'nfournisseur');
          return getNfact && getNfourn &&
            String(r[getNfact]).trim() === String(nfact).trim() &&
            String(r[getNfourn]).trim() === String(nfournisseur).trim();
        });
        if (found) { blRow = found; break; }
      } catch { /* try next */ }
    }

    if (!blRow) {
      return NextResponse.json({ success: false, error: `BL achat ${nfact}/${nfournisseur} introuvable` }, { status: 404 });
    }

    // Load details — try bachat_detail then bl_achat_detail
    for (const tbl of ['bachat_detail', 'bl_achat_detail', 'detail_bl_achat']) {
      try {
        const rows = await readTable(tenant, tbl);
        const filtered = rows.filter((r: any) => {
          const rk = Object.keys(r);
          const getNfact = rk.find(k => k.toLowerCase() === 'nfact');
          const getNfourn = rk.find(k => k.toLowerCase() === 'nfournisseur');
          return getNfact && getNfourn &&
            String(r[getNfact]).trim() === String(nfact).trim() &&
            String(r[getNfourn]).trim() === String(nfournisseur).trim();
        });
        if (filtered.length > 0) { detailRows = filtered; break; }
      } catch { /* try next */ }
    }

    // Normalize BL header
    const bk = Object.keys(blRow);
    const bv = (...names: string[]) => {
      for (const n of names) {
        const k = bk.find(k => k.toLowerCase() === n.toLowerCase());
        if (k && blRow[k] != null) return blRow[k];
      }
      return undefined;
    };

    const montant_ht = parseFloat(bv('montant_ht', 'mht') || 0);
    const tva = parseFloat(bv('tva', 'montant_tva') || 0);

    const normalized = {
      ...blRow,
      nfact: bv('nfact', 'nbl_achat', 'id'),
      nfournisseur: bv('nfournisseur', 'supplier_code'),
      date_bl: bv('date_bl', 'date_fact', 'date'),
      montant_ht,
      tva,
      total_ttc: parseFloat(bv('total_ttc', 'montant_ttc') || 0) || (montant_ht + tva),
      timbre: parseFloat(bv('timbre') || 0),
      details: detailRows.map((d: any) => {
        const dk = Object.keys(d);
        const dv = (...names: string[]) => {
          for (const n of names) {
            const k = dk.find(k => k.toLowerCase() === n.toLowerCase());
            if (k && d[k] != null) return d[k];
          }
          return undefined;
        };
        const qte = parseFloat(dv('qte', 'Qte', 'quantite') || 0);
        const prix = parseFloat(dv('prix', 'prix_unitaire') || 0);
        return {
          ...d,
          narticle: dv('narticle', 'Narticle', 'article'),
          designation: dv('designation', 'libelle', 'nom_article') || '',
          qte,
          prix,
          tva: parseFloat(dv('tva', 'TVA') || 0),
          total_ligne: parseFloat(dv('total_ligne', 'Total_ligne') || 0) || (qte * prix),
        };
      }),
    };

    // Enrich designations from article table if missing
    const missingDesig = normalized.details.filter((d: any) => !d.designation && d.narticle);
    if (missingDesig.length > 0) {
      try {
        const artRows = await readTable(tenant, 'article');
        const artMap: Record<string, string> = {};
        artRows.forEach((a: any) => {
          const ak = Object.keys(a);
          const av = (...names: string[]) => { for (const n of names) { const k = ak.find(k => k.toLowerCase() === n.toLowerCase()); if (k && a[k]) return a[k]; } return ''; };
          const code = String(av('narticle', 'Narticle') || '').trim();
          const desig = av('designation', 'Designation', 'libelle');
          if (code) artMap[code] = desig;
        });
        normalized.details.forEach((d: any) => {
          if (!d.designation && d.narticle) {
            d.designation = artMap[String(d.narticle).trim()] || '';
          }
        });
      } catch { /* non critique */ }
    }

    return NextResponse.json({ success: true, data: normalized, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error(`❌ [purchases/delivery-notes/${nfact}/${nfournisseur}]`, msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ nfact: string; nfournisseur: string }> }
) {
  const { nfact, nfournisseur } = await params;
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(
        `${BACKEND_URL}/api/purchases/delivery-notes/${encodeURIComponent(nfact)}/${encodeURIComponent(nfournisseur)}`,
        {
          method: 'PUT',
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  return NextResponse.json({ success: false, error: 'Backend non disponible pour la modification' }, { status: 503 });
}
