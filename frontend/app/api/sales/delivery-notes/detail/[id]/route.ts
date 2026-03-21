import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BACKEND_URL = process.env.BACKEND_URL;

async function supabaseGet(schema: string, table: string, col: string, val: number, limit?: number): Promise<any[]> {
  const limitStr = limit ? `&limit=${limit}` : '';
  const url = `${SUPABASE_URL}/rest/v1/${table}?${col}=eq.${val}&select=*${limitStr}`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Accept-Profile': schema,
      'Accept': 'application/json',
    },
    signal: AbortSignal.timeout(7000),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`${table} ${col}=eq.${val} → ${res.status}: ${err.slice(0, 200)}`);
  }
  const rows = await res.json();
  return Array.isArray(rows) ? rows : [];
}

function normalizeRow(r: any, mapping: Record<string, string[]>): Record<string, any> {
  const keys = Object.keys(r);
  const find = (...names: string[]) => {
    for (const n of names) {
      const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
      if (k !== undefined && r[k] !== null && r[k] !== undefined) return r[k];
    }
    return undefined;
  };
  const result: Record<string, any> = { ...r };
  for (const [target, candidates] of Object.entries(mapping)) {
    result[target] = find(...candidates);
  }
  return result;
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  const numericId = parseInt(id);
  if (!id || isNaN(numericId) || numericId <= 0) {
    return NextResponse.json({ success: false, error: `ID BL invalide: ${id}` }, { status: 400 });
  }

  // 1. Backend local (timeout court 3s)
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${numericId}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* backend indisponible */ }
  }

  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    // Charger BL header
    let blRows: any[] = [];
    try {
      blRows = await supabaseGet(tenant, 'bl', 'nfact', numericId, 1);
    } catch {
      blRows = await supabaseGet(tenant, 'bl', 'nbl', numericId, 1).catch(() => []);
    }

    const bl = blRows[0] ?? null;
    if (!bl) {
      return NextResponse.json({ success: false, error: `BL ${numericId} introuvable` }, { status: 404 });
    }

    // Charger detail_bl — essayer nfact puis Nfact (vieilles bases)
    let detailRows: any[] = [];
    const detailCols = ['nfact', 'Nfact', 'nbl', 'Nbl'];
    for (const col of detailCols) {
      try {
        detailRows = await supabaseGet(tenant, 'detail_bl', col, numericId);
        if (detailRows.length > 0) {
          console.log(`✅ [BL ${numericId}] ${detailRows.length} détails via detail_bl.${col} dans ${tenant}`);
          break;
        }
      } catch { /* essayer colonne suivante */ }
    }

    if (detailRows.length === 0) {
      console.warn(`⚠️ [BL ${numericId}] Aucun détail trouvé dans detail_bl pour ${tenant}`);
    }

    const normalized = normalizeRow(bl, {
      nbl: ['nbl', 'nfact', 'id'],
      nfact: ['nfact', 'nbl', 'id'],
      nclient: ['nclient', 'ncli', 'code_client'],
      client_name: ['client_name', 'raison_sociale', 'nom', 'client'],
      date_fact: ['date_fact', 'date_bl', 'date'],
      date_bl: ['date_bl', 'date_fact', 'date'],
      montant_ht: ['montant_ht', 'mht', 'total_ht'],
      tva: ['tva', 'montant_tva', 'taxe'],
      montant_ttc: ['montant_ttc', 'total_ttc', 'mttc'],
    });

    const details = detailRows.map((d: any) => normalizeRow(d, {
      narticle: ['narticle', 'article', 'code_article', 'ref'],
      designation: ['designation', 'libelle', 'nom_article', 'description'],
      qte: ['qte', 'quantite', 'qty'],
      prix: ['prix', 'prix_unitaire', 'pu', 'prix_vente'],
      tva: ['tva', 'taux_tva', 'taxe'],
      total_ligne: ['total_ligne', 'montant_ligne', 'total', 'montant'],
    }));

    return NextResponse.json({
      success: true,
      data: { ...normalized, details, detail_bl: details },
      source: 'supabase_direct'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur inconnue';
    console.error(`❌ [delivery-notes/detail/${numericId}]`, msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
