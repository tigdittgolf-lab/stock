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
    // Normaliser les noms de colonnes (majuscules/minuscules selon l'ancienneté de la base)
    const data = rows.map((r: any) => {
      const nbl = r.nbl ?? r.Nbl ?? r.NBL ?? r.nfact ?? r.Nfact ?? r.NFACT ?? r.id;
      const nfact = r.nfact ?? r.Nfact ?? r.NFACT ?? r.nbl ?? r.Nbl ?? r.id;
      return {
        nbl,
        nfact,
        date_fact: r.date_fact ?? r.Date_fact ?? r.date_bl ?? r.Date_bl,
        date_bl: r.date_bl ?? r.Date_bl ?? r.date_fact ?? r.Date_fact,
        nclient: r.nclient ?? r.Nclient ?? r.NCLIENT,
        client_name: r.client_name ?? r.raison_sociale ?? r.nom,
        montant_ht: r.montant_ht ?? r.Montant_ht,
        tva: r.tva ?? r.TVA ?? r.Tva,
        montant_ttc: r.montant_ttc ?? r.Montant_ttc ?? r.total_ttc,
        timbre: r.timbre ?? r.Timbre,
        statut: r.statut ?? r.Statut,
        marge: r.marge ?? r.Marge,
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
