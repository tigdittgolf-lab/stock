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
  // Construire un objet sans les clés originales à majuscules — évite les doublons JSON (NFact + nfact)
  const result: Record<string, any> = {};
  // Copier les clés originales en les normalisant en minuscules
  for (const k of keys) {
    result[k.toLowerCase()] = r[k];
  }
  // Appliquer le mapping explicite (écrase si nécessaire)
  for (const [target, candidates] of Object.entries(mapping)) {
    const val = find(...candidates);
    if (val !== undefined) result[target] = val;
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
      let details = detailRows.map((d: any) => normalizeRow(d, {
        narticle: ['narticle', 'article', 'code_article', 'ref'],
        designation: ['designation', 'libelle', 'nom_article', 'description'],
        qte: ['qte', 'quantite', 'qty'], prix: ['prix', 'prix_unitaire', 'pu', 'prix_vente'],
        tva: ['tva', 'taux_tva', 'taxe'], total_ligne: ['total_ligne', 'montant_ligne', 'total', 'montant'],
      }));

      // Si désignations manquantes, charger depuis table article
      const missingDesig = details.filter((d: any) => !d.designation && d.narticle);
      if (missingDesig.length > 0) {
        try {
          const codes = [...new Set(missingDesig.map((d: any) => String(d.narticle)))];
          const artRows = await readTable(tenant, 'article');
          const artMap: Record<string, string> = {};
          artRows.forEach((a: any) => {
            const keys = Object.keys(a);
            const findVal = (...names: string[]) => { for (const n of names) { const k = keys.find(k => k.toLowerCase() === n.toLowerCase()); if (k && a[k]) return a[k]; } return ''; };
            const code = String(findVal('narticle', 'code_article', 'ref') || '').trim();
            const desig = findVal('designation', 'libelle', 'nom_article', 'description');
            if (code) artMap[code] = desig;
          });
          details = details.map((d: any) => ({
            ...d,
            designation: d.designation || artMap[String(d.narticle).trim()] || '',
          }));
          console.log(`✅ [BL ${numericId}] désignations enrichies depuis article`);
        } catch (e) {
          console.warn(`⚠️ [BL ${numericId}] enrichissement désignations échoué:`, e);
        }
      }

      // Si client_name manquant, charger depuis table client
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
            normalized.client_name = findVal('raison_sociale', 'nom', 'client_name', 'libelle');
          }
        } catch (e) {
          console.warn(`⚠️ [BL ${numericId}] chargement client échoué:`, e);
        }
      }

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
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';
  const body = await request.json();

  // 1. Try backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      // Backend returned an error — fall through to Supabase fallback
      console.warn(`[delivery-notes POST] Backend returned ${res.status}, falling back to Supabase`);
    } catch (e) {
      console.warn('[delivery-notes POST] Backend unavailable, trying Supabase direct');
    }
  }

  // 2. Supabase direct fallback
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible pour la création' }, { status: 503 });
  }

  try {
    const { Nclient, date_fact, detail_bl } = body;
    if (!Nclient || !detail_bl || !Array.isArray(detail_bl) || detail_bl.length === 0) {
      return NextResponse.json({ success: false, error: 'Données manquantes: Nclient et detail_bl requis' }, { status: 400 });
    }

    const dateVal = date_fact || new Date().toISOString().split('T')[0];

    // Calculate totals
    const montant_ht = detail_bl.reduce((sum: number, l: any) => sum + (l.Qte * l.prix), 0);
    const tva_total = detail_bl.reduce((sum: number, l: any) => sum + (l.Qte * l.prix * (l.tva || 0) / 100), 0);
    const montant_ttc = montant_ht + tva_total;

    // Get next BL number via readTable
    const blRows = await readTable(tenant, 'bl');
    let nextNum = 1;
    if (blRows.length > 0) {
      const keys = Object.keys(blRows[0]);
      const colName = keys.find(k => k.toLowerCase() === 'nfact') ||
                      keys.find(k => k.toLowerCase() === 'nbl') ||
                      keys.find(k => k.toLowerCase() === 'id');
      if (colName) {
        const maxNum = blRows.reduce((max: number, r: any) => {
          const val = parseInt(r[colName]);
          return isNaN(val) ? max : Math.max(max, val);
        }, 0);
        nextNum = maxNum + 1;
      }
    }

    // Insert BL header via RPC insert_bl_simple
    const blRpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_bl_simple`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_tenant: tenant,
        p_nfact: nextNum,
        p_nclient: Nclient,
        p_date_fact: dateVal,
        p_montant_ht: montant_ht,
        p_tva: tva_total,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!blRpc.ok) {
      const err = await blRpc.text();
      return NextResponse.json({ success: false, error: `Erreur création BL: ${err}` }, { status: 500 });
    }

    // Insert detail lines via RPC insert_detail_bl_simple
    for (const l of detail_bl) {
      const total_ligne = l.Qte * l.prix;
      const detailRpc = await fetch(`${SUPABASE_URL}/rest/v1/rpc/insert_detail_bl_simple`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_tenant: tenant,
          p_nfact: nextNum,
          p_narticle: l.Narticle,
          p_qte: l.Qte,
          p_prix: l.prix,
          p_tva: l.tva || 0,
          p_total_ligne: total_ligne,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (!detailRpc.ok) {
        const err = await detailRpc.text();
        console.warn(`[delivery-notes POST] detail insert warning for ${l.Narticle}: ${err}`);
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        nbl: nextNum, nfact: nextNum,
        message: 'Bon de livraison créé avec succès',
        montant_ht, tva: tva_total, total_ttc: montant_ttc
      },
      source: 'supabase_direct'
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    console.error('❌ [delivery-notes POST]', msg);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
