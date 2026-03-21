import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

const emptyOk = () => NextResponse.json({ success: true, data: [], source: 'empty_schema' });
const schemaError = (msg: string) =>
  msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422');

const normalizeInvoice = (r: any) => {
  const keys = Object.keys(r);
  const find = (...names: string[]) => {
    for (const n of names) {
      const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
      if (k !== undefined && r[k] !== undefined && r[k] !== null) return r[k];
    }
    return undefined;
  };
  return {
    nfact: find('nfact', 'id', 'num_fact', 'numero'),
    date_fact: find('date_fact', 'date'),
    nclient: find('nclient', 'ncli', 'code_client'),
    client_name: find('client_name', 'raison_sociale', 'nom', 'client'),
    montant_ht: find('montant_ht', 'mht', 'total_ht'),
    tva: find('tva', 'montant_tva', 'taxe'),
    montant_ttc: find('montant_ttc', 'total_ttc', 'mttc'),
    timbre: find('timbre'),
    statut: find('statut', 'etat'),
    marge: find('marge'),
  };
};

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[invoices] Backend ${res.status}, fallback Supabase`);
    } catch {
      console.warn('[invoices] Backend unavailable, fallback Supabase');
    }
  }

  if (dbType !== 'supabase') return emptyOk();

  try {
    const rows = await readTable(tenant, 'facture');
    if (rows.length > 0) {
      console.log(`🔑 [invoices] Colonnes réelles pour ${tenant}:`, Object.keys(rows[0]));
    }
    const data = rows.map(normalizeInvoice);
    console.log(`✅ [invoices direct] ${data.length} for ${tenant}, sample nfact: ${data[0]?.nfact}`);
    return NextResponse.json({ success: true, data, count: data.length, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (schemaError(msg)) {
      console.warn(`⚠️ [invoices] Schéma ${tenant} introuvable, retour vide`);
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
      const res = await fetch(`${BACKEND_URL}/api/sales/invoices`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      const err = await res.text();
      return NextResponse.json({ success: false, error: `Backend error: ${res.status} - ${err}` }, { status: res.status });
    } catch {
      console.warn('[invoices POST] Backend unavailable');
    }
  }
  return NextResponse.json({ success: false, error: 'Backend non disponible pour la création' }, { status: 503 });
}
