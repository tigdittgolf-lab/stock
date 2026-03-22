import { NextRequest, NextResponse } from 'next/server';
import { readTable, readTableById, readTableWhere } from '@/lib/supabase-rpc';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const BACKEND_URL = process.env.BACKEND_URL;

const emptyOk = () => NextResponse.json({ success: true, data: [], source: 'empty_schema' });
const schemaError = (msg: string) =>
  msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422');

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
  if (!res.ok) throw new Error(`${table} ${col}=${val} → ${res.status}`);
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

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  // Si ?id= présent → retourner le détail d'un BL (contourne le problème de route [id] sur Vercel)
  const idParam = request.nextUrl.searchParams.get('id');
  if (idParam) {
    const numericId = parseInt(idParam);
    if (isNaN(numericId) || numericId <= 0) {
      return NextResponse.json({ success: false, error: `ID invalide: ${idParam}` }, { status: 400 });
    }

    // Backend local
    if (BACKEND_URL) {
      try {
        const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${numericId}`, {
          headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) return NextResponse.json(await res.json());
      } catch { /* fallback */ }
    }

    if (dbType !== 'supabase') {
      return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
    }

    try {
      // Utilise readTableById (RPC SECURITY DEFINER) — fonctionne sur tous les schémas
      const bl = await readTableById(tenant, 'bl', numericId);
      if (!bl) {
        return NextResponse.json({ success: false, error: `BL ${numericId} introuvable` }, { status: 404 });
      }

      // Charger detail_bl via readTableWhere — essaie nfact puis nbl
      let detailRows: any[] = [];
      for (const col of ['nfact', 'nbl']) {
        try {
          detailRows = await readTableWhere(tenant, 'detail_bl', col, numericId);
          if (detailRows.length > 0) break;
        } catch { /* essayer suivant */ }
      }
      // Si toujours vide, fallback: charger toute la table et filtrer (gère les colonnes avec majuscules)
      if (detailRows.length === 0) {
        try {
          const allDetails = await readTable(tenant, 'detail_bl');
          detailRows = allDetails.filter((d: any) => {
            const keys = Object.keys(d);
            for (const candidate of ['nfact', 'nbl', 'NFact', 'Nfact', 'NBL', 'Nbl']) {
              const k = keys.find(k => k.toLowerCase() === candidate.toLowerCase());
              if (k && Number(d[k]) === numericId) return true;
            }
            return false;
          });
          console.log(`🔄 [BL ${numericId}] fallback readTable detail_bl: ${detailRows.length} lignes`);
        } catch (e) {
          console.warn(`⚠️ [BL ${numericId}] detail_bl fallback failed:`, e);
        }
      }
      console.log(`✅ [BL ${numericId}] ${detailRows.length} détails dans ${tenant}`);

      const normalized = normalizeRow(bl, {
        nbl: ['nbl', 'nfact', 'id'], nfact: ['nfact', 'nbl', 'id'],
        nclient: ['nclient', 'ncli', 'code_client'],
        client_name: ['client_name', 'raison_sociale', 'nom', 'client'],
        date_fact: ['date_fact', 'date_bl', 'date'], date_bl: ['date_bl', 'date_fact', 'date'],
        montant_ht: ['montant_ht', 'mht', 'total_ht'], tva: ['tva', 'montant_tva', 'taxe'],
        montant_ttc: ['montant_ttc', 'total_ttc', 'mttc'],
      });
      const details = detailRows.map((d: any) => normalizeRow(d, {
        narticle: ['narticle', 'article', 'code_article', 'ref'],
        designation: ['designation', 'libelle', 'nom_article', 'description'],
        qte: ['qte', 'quantite', 'qty'], prix: ['prix', 'prix_unitaire', 'pu', 'prix_vente'],
        tva: ['tva', 'taux_tva', 'taxe'], total_ligne: ['total_ligne', 'montant_ligne', 'total', 'montant'],
      }));

      return NextResponse.json({ success: true, data: { ...normalized, details, detail_bl: details }, source: 'supabase_rpc' });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erreur';
      console.error(`❌ [delivery-notes?id=${numericId}]`, msg);
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  }

  // 1. Essayer le backend si disponible
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[delivery-notes] Backend ${res.status}, fallback Supabase`);
    } catch {
      console.warn('[delivery-notes] Backend unavailable, fallback Supabase');
    }
  }

  // 2. Supabase direct
  if (dbType !== 'supabase') return emptyOk();

  try {
    const rows = await readTable(tenant, 'bl');
    // Log des vraies colonnes pour diagnostic (première ligne seulement)
    if (rows.length > 0) {
      console.log(`🔑 [delivery-notes] Colonnes réelles pour ${tenant}:`, Object.keys(rows[0]));
    }
    // Normaliser les noms de colonnes — recherche insensible à la casse
    const data = rows.map((r: any) => {
      const keys = Object.keys(r);
      const findKey = (...names: string[]) => {
        for (const n of names) {
          const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
          if (k !== undefined && r[k] !== undefined && r[k] !== null) return r[k];
        }
        return undefined;
      };
      const nbl = findKey('nbl', 'nfact', 'id', 'num_bl', 'numero');
      const nfact = findKey('nfact', 'nbl', 'id', 'num_fact', 'numero');
      return {
        nbl,
        nfact,
        date_fact: findKey('date_fact', 'date_bl', 'date'),
        date_bl: findKey('date_bl', 'date_fact', 'date'),
        nclient: findKey('nclient', 'ncli', 'code_client'),
        client_name: findKey('client_name', 'raison_sociale', 'nom', 'client'),
        montant_ht: findKey('montant_ht', 'mht', 'total_ht'),
        tva: findKey('tva', 'montant_tva', 'taxe'),
        montant_ttc: findKey('montant_ttc', 'total_ttc', 'mttc'),
        timbre: findKey('timbre'),
        statut: findKey('statut', 'etat'),
        marge: findKey('marge'),
      };
    });
    console.log(`✅ [delivery-notes direct] ${data.length} for ${tenant}, sample nbl: ${data[0]?.nbl}`);
    return NextResponse.json({ success: true, data, count: data.length, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (schemaError(msg)) {
      console.warn(`⚠️ [delivery-notes] Schéma ${tenant} introuvable, retour vide`);
      return emptyOk();
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
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      const err = await res.text();
      return NextResponse.json({ success: false, error: `Backend error: ${res.status} - ${err}` }, { status: res.status });
    } catch (e) {
      console.warn('[delivery-notes POST] Backend unavailable');
    }
  }
  return NextResponse.json({ success: false, error: 'Backend non disponible pour la création' }, { status: 503 });
}
