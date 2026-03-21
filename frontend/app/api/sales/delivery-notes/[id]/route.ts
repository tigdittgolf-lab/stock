import { NextRequest, NextResponse } from 'next/server';
import { readTableById, readTableWhere } from '@/lib/supabase-rpc';

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
    const bl = await readTableById(tenant, 'bl', numericId);
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

    // Charger les détails
    let details: any[] = [];
    try {
      details = await readTableWhere(tenant, 'detail_bl', 'nfact', numericId);
      if (details.length === 0) {
        details = await readTableWhere(tenant, 'detail_bl', 'nbl', numericId);
      }
      // Normaliser les détails aussi
      details = details.map((d: any) => {
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
          narticle: df('narticle', 'article', 'code_article'),
          designation: df('designation', 'libelle', 'nom_article'),
          qte: df('qte', 'quantite', 'qty'),
          prix: df('prix', 'prix_unitaire', 'pu'),
          tva: df('tva', 'taux_tva'),
          total_ligne: df('total_ligne', 'montant_ligne', 'total'),
        };
      });
    } catch { /* pas de détails */ }

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
