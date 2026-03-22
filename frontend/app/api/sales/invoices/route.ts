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

  // Détail d'une facture par ID
  if (idParam) {
    const numericId = parseInt(idParam);
    if (isNaN(numericId) || numericId <= 0) {
      return NextResponse.json({ success: false, error: `ID invalide: ${idParam}` }, { status: 400 });
    }
    if (BACKEND_URL) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sales/invoices/${numericId}`, {
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) return NextResponse.json(await res.json());
      } catch { /* fallback */ }
    }
    if (dbType !== 'supabase') return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
    try {
      // Essayer facture puis fact
      let fact: any = null;
      for (const tbl of ['facture', 'fact']) {
        try { fact = await readTableById(tenant, tbl, numericId); if (fact) break; } catch { /* essayer suivant */ }
      }
      if (!fact) return NextResponse.json({ success: false, error: `Facture ${numericId} introuvable` }, { status: 404 });

      // Détails
      let detailRows: any[] = [];
      for (const tbl of ['detail_fact', 'detail_facture']) {
        for (const col of ['nfact', 'NFact']) {
          try { detailRows = await readTableWhere(tenant, tbl, col, numericId); if (detailRows.length > 0) break; } catch { /* continuer */ }
        }
        if (detailRows.length > 0) break;
      }

      const normalized = normalizeRow(fact, {
        nfact: ['nfact', 'id'], nclient: ['nclient', 'ncli'],
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

      // Enrichir client_name si manquant
      if (!normalized.client_name && normalized.nclient) {
        try {
          const clientRows = await readTable(tenant, 'client');
          const found = clientRows.find((c: any) => {
            const keys = Object.keys(c);
            const k = keys.find(k => k.toLowerCase() === 'nclient');
            return k && String(c[k]) === String(normalized.nclient);
          });
          if (found) {
            const keys = Object.keys(found);
            const findVal = (...names: string[]) => { for (const n of names) { const k = keys.find(k => k.toLowerCase() === n.toLowerCase()); if (k && found[k]) return found[k]; } return ''; };
            normalized.client_name = findVal('raison_sociale', 'nom', 'client_name');
          }
        } catch { /* non critique */ }
      }

      return NextResponse.json({ success: true, data: { ...normalized, details, detail_fact: details }, source: 'supabase_rpc' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  // Liste des factures
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[invoices] Backend unavailable'); }
  }

  if (dbType !== 'supabase') return emptyOk();

  try {
    let rows: any[] = [];
    for (const tbl of ['facture', 'fact']) {
      try { rows = await readTable(tenant, tbl); if (rows.length > 0) break; } catch { /* essayer suivant */ }
    }
    const data = rows.map((r: any) => normalizeRow(r, {
      nfact: ['nfact', 'id'], nclient: ['nclient', 'ncli'],
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function supabaseInsert(schema: string, table: string, body: object | object[]) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Accept-Profile': schema,
      'Content-Profile': schema,
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table} HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supabaseRpc(fn: string, params: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });
  return res;
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  // Essayer le backend d'abord
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices`, {
        method: 'POST',
        headers: {
          'X-Tenant': tenant,
          'X-Database-Type': dbType,
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true',
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[invoices POST] Backend ${res.status}, fallback Supabase direct`);
    } catch {
      console.warn('[invoices POST] Backend unavailable, using Supabase direct');
    }
  }

  // Fallback Supabase direct
  try {
    if (dbType !== 'supabase') {
      return NextResponse.json({ success: false, error: 'Backend requis pour MySQL/PostgreSQL' }, { status: 503 });
    }
    if (!tenant) {
      return NextResponse.json({ success: false, error: 'Tenant requis' }, { status: 400 });
    }

    const { Nclient, date_fact, detail_fact } = body;
    if (!Nclient || !detail_fact?.length) {
      return NextResponse.json({ success: false, error: 'Client et lignes requis' }, { status: 400 });
    }

    // Calculer les totaux
    let montant_ht = 0, tva_total = 0;
    for (const l of detail_fact) {
      const ht = l.Qte * l.prix;
      montant_ht += ht;
      tva_total += ht * (l.tva / 100);
    }
    const total_ttc = montant_ht + tva_total;

    // Insérer la facture
    const [facture] = await supabaseInsert(tenant, 'facture', {
      Nclient,
      date_fact: date_fact || new Date().toISOString().split('T')[0],
      montant_ht,
      tva: tva_total,
      montant_ttc: total_ttc,
    });

    if (!facture) {
      return NextResponse.json({ success: false, error: 'Erreur insertion facture' }, { status: 500 });
    }

    const nfact = facture.Nfact || facture.nfact || facture.id;

    // Insérer les lignes de détail
    const details = detail_fact.map((l: any) => ({
      Nfact: nfact,
      Narticle: l.Narticle,
      Qte: l.Qte,
      prix: l.prix,
      tva: l.tva,
      pr_achat: l.pr_achat || 0,
      total_ligne: l.Qte * l.prix,
    }));
    await supabaseInsert(tenant, 'detail_fact', details);

    // Décrémenter le stock_f pour chaque article
    for (const l of detail_fact) {
      await supabaseRpc('exec_sql', {
        sql: `UPDATE "${tenant}"."article" SET "stock_f" = COALESCE("stock_f", 0) - ${l.Qte} WHERE "Narticle" = '${l.Narticle}'`
      });
    }

    return NextResponse.json({
      success: true,
      message: `Facture N°${nfact} créée avec succès`,
      data: {
        nfact,
        montant_ht,
        tva: tva_total,
        total_ttc,
        message: `Facture N°${nfact} créée avec succès`,
      },
    });

  } catch (error) {
    console.error('❌ invoices POST error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Erreur' },
      { status: 500 }
    );
  }
}
