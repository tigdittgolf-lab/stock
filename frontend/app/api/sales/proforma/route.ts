import { NextRequest, NextResponse } from 'next/server';
import { readTable, readTableById, readTableWhere } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;
const emptyOk = () => NextResponse.json({ success: true, data: [], source: 'empty_schema' });
const schemaError = (msg: string) =>
  msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422');

function normalizeRow(r: any, mapping: Record<string, string[]>): Record<string, any> {
  const keys = Object.keys(r);
  const result: Record<string, any> = {};
  for (const k of keys) result[k.toLowerCase()] = r[k];
  for (const [target, candidates] of Object.entries(mapping)) {
    for (const n of candidates) {
      const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
      if (k !== undefined && r[k] !== null && r[k] !== undefined) { result[target] = r[k]; break; }
    }
  }
  return result;
}

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const idParam = request.nextUrl.searchParams.get('id');

  if (idParam) {
    const numericId = parseInt(idParam);
    if (isNaN(numericId) || numericId <= 0) {
      return NextResponse.json({ success: false, error: `ID invalide: ${idParam}` }, { status: 400 });
    }
    if (BACKEND_URL) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sales/proforma/${numericId}`, {
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) return NextResponse.json(await res.json());
      } catch { /* fallback */ }
    }
    if (dbType !== 'supabase') return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
    try {
      let pf: any = null;
      for (const tbl of ['proforma', 'proformat', 'fact_proforma']) {
        try { pf = await readTableById(tenant, tbl, numericId); if (pf) break; } catch { /* continuer */ }
      }
      if (!pf) return NextResponse.json({ success: false, error: `Proforma ${numericId} introuvable` }, { status: 404 });

      let detailRows: any[] = [];
      for (const tbl of ['detail_proforma', 'detail_proformat', 'detail_fact_proforma']) {
        for (const col of ['nfact', 'NFact', 'nproforma']) {
          try { detailRows = await readTableWhere(tenant, tbl, col, numericId); if (detailRows.length > 0) break; } catch { /* continuer */ }
        }
        if (detailRows.length > 0) break;
      }

      const normalized = normalizeRow(pf, {
        nfact: ['nfact', 'id', 'nproforma'], nclient: ['nclient', 'ncli'],
        client_name: ['client_name', 'raison_sociale', 'nom'],
        date_fact: ['date_fact', 'date'], montant_ht: ['montant_ht', 'mht'],
        tva: ['tva', 'montant_tva'], montant_ttc: ['montant_ttc', 'total_ttc', 'mttc'],
        timbre: ['timbre'], autre_taxe: ['autre_taxe'],
      });

      let details = detailRows.map((d: any) => normalizeRow(d, {
        narticle: ['narticle', 'article', 'code_article'],
        designation: ['designation', 'libelle', 'nom_article'],
        qte: ['qte', 'quantite'], prix: ['prix', 'prix_unitaire', 'pu'],
        tva: ['tva', 'taux_tva'], total_ligne: ['total_ligne', 'montant_ligne', 'total'],
      }));

      // Enrichir désignations depuis article si manquantes
      if (details.some((d: any) => !d.designation && d.narticle)) {
        try {
          const artRows = await readTable(tenant, 'article');
          const artMap: Record<string, string> = {};
          artRows.forEach((a: any) => {
            const keys = Object.keys(a);
            const findVal = (...names: string[]) => { for (const n of names) { const k = keys.find(k => k.toLowerCase() === n.toLowerCase()); if (k && a[k]) return a[k]; } return ''; };
            const code = String(findVal('narticle') || '').trim();
            if (code) artMap[code] = findVal('designation', 'libelle', 'nom_article');
          });
          details = details.map((d: any) => ({ ...d, designation: d.designation || artMap[String(d.narticle).trim()] || '' }));
        } catch { /* non critique */ }
      }

      return NextResponse.json({ success: true, data: { ...normalized, details, detail_fact: details }, source: 'supabase_rpc' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  // Liste
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/proforma`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[proforma] Backend unavailable'); }
  }

  if (dbType !== 'supabase') return emptyOk();

  try {
    let rows: any[] = [];
    for (const tbl of ['proforma', 'proformat', 'fact_proforma']) {
      try { rows = await readTable(tenant, tbl); if (rows.length > 0) break; } catch { /* essayer suivant */ }
    }
    const data = rows.map((r: any) => normalizeRow(r, {
      nfact: ['nfact', 'id', 'nproforma'], nclient: ['nclient', 'ncli'],
      client_name: ['client_name', 'raison_sociale', 'nom'],
      date_fact: ['date_fact', 'date'], montant_ht: ['montant_ht', 'mht'],
      tva: ['tva', 'montant_tva'], montant_ttc: ['montant_ttc', 'total_ttc', 'mttc'],
      timbre: ['timbre'], statut: ['statut', 'etat'],
    }));
    return NextResponse.json({ success: true, data, count: data.length, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (schemaError(msg)) return emptyOk();
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/proforma`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[proforma POST] Backend unavailable'); }
  }
  return NextResponse.json({ success: false, error: 'Backend non disponible pour la création' }, { status: 503 });
}
