import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

const emptyOk = () => NextResponse.json({ success: true, data: [], source: 'empty_schema' });
const schemaError = (msg: string) =>
  msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422');

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

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
