import { NextRequest, NextResponse } from 'next/server';
import { readTableById, readTableWhere } from '@/lib/supabase-rpc';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Charge les lignes de detail_bl via l'API REST Supabase avec Accept-Profile (schéma).
 * Beaucoup plus rapide que readTable car filtre côté serveur.
 */
async function fetchDetailBl(schema: string, nfact: number): Promise<any[]> {
  // Essayer nfact puis nbl comme colonne de jointure
  for (const col of ['nfact', 'nbl', 'Nfact', 'Nbl']) {
    try {
      const url = `${SUPABASE_URL}/rest/v1/detail_bl?${col}=eq.${nfact}&select=*`;
      const res = await fetch(url, {
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Accept-Profile': schema,
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows.length > 0) {
          console.log(`✅ [detail_bl REST] ${rows.length} lignes via ${col}=eq.${nfact} dans ${schema}`);
          console.log(`🔑 [detail_bl REST] Colonnes:`, Object.keys(rows[0]));
          return rows;
        }
      } else {
        const err = await res.text();
        console.warn(`[detail_bl REST] ${col} → ${res.status}: ${err.slice(0, 100)}`);
      }
    } catch (e) {
      console.warn(`[detail_bl REST] Erreur col ${col}:`, e);
    }
  }
  return [];
}

const BACKEND_URL = process.env.BACKEND_URL;

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

  // 1. Backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${numericId}`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[delivery-notes/id] Backend unavailable'); }
  }

  // 2. Supabase direct
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }

  try {
    // Charger le BL via API REST Supabase avec Accept-Profile
    let bl: any = null;
    for (const col of ['nfact', 'nbl', 'Nfact', 'Nbl', 'id']) {
      try {
        const url = `${SUPABASE_URL}/rest/v1/bl?${col}=eq.${numericId}&select=*&limit=1`;
        const res = await fetch(url, {
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Accept-Profile': tenant,
            'Content-Type': 'application/json',
          },
          signal: AbortSignal.timeout(8000),
        });
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows) && rows.length > 0) {
            bl = rows[0];
            console.log(`✅ [bl REST] Trouvé via ${col}=eq.${numericId} dans ${tenant}`);
            break;
          }
        }
      } catch { /* essayer colonne suivante */ }
    }
    // Fallback RPC si REST échoue
    if (!bl) bl = await readTableById(tenant, 'bl', numericId);
    if (!bl) return NextResponse.json({ success: false, error: `BL ${numericId} introuvable` }, { status: 404 });

    // Normaliser les colonnes (insensible à la casse)
    const keys = Object.keys(bl);
    const find = (...names: string[]) => {
      for (const n of names) {
        const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
        if (k !== undefined && bl[k] !== null && bl[k] !== undefined) return bl[k];
      }
      return undefined;
    };
    const normalized = {
      ...bl,
      nbl: find('nbl', 'nfact', 'id'),
      nfact: find('nfact', 'nbl', 'id'),
      nclient: find('nclient', 'ncli', 'code_client'),
      client_name: find('client_name', 'raison_sociale', 'nom', 'client'),
      date_fact: find('date_fact', 'date_bl', 'date'),
      date_bl: find('date_bl', 'date_fact', 'date'),
      montant_ht: find('montant_ht', 'mht', 'total_ht'),
      tva: find('tva', 'montant_tva', 'taxe'),
      montant_ttc: find('montant_ttc', 'total_ttc', 'mttc'),
    };

    // Charger les détails via detail_bl — API REST Supabase avec filtre natif
    let details: any[] = [];
    try {
      const detailRows = await fetchDetailBl(tenant, numericId);
      details = detailRows.map((d: any) => {
        const dk = Object.keys(d);
        const df = (...names: string[]) => {
          for (const n of names) {
            const k = dk.find(k => k.toLowerCase() === n.toLowerCase());
            if (k !== undefined && d[k] !== null && d[k] !== undefined) return d[k];
          }
          return undefined;
        };
        return {
          ...d,
          narticle: df('narticle', 'article', 'code_article', 'ref'),
          designation: df('designation', 'libelle', 'nom_article', 'description'),
          qte: df('qte', 'quantite', 'qty'),
          prix: df('prix', 'prix_unitaire', 'pu', 'prix_vente'),
          tva: df('tva', 'taux_tva', 'taxe'),
          total_ligne: df('total_ligne', 'montant_ligne', 'total', 'montant'),
        };
      });
    } catch (e) {
      console.warn(`⚠️ Erreur chargement detail_bl:`, e);
    }

    return NextResponse.json({ success: true, data: { ...normalized, details, detail_bl: details }, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
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
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      return NextResponse.json(await res.json(), { status: res.status });
    } catch { console.warn('[delivery-notes DELETE] Backend unavailable'); }
  }
  return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
}
