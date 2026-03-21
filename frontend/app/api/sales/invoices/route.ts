import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

const emptyOk = () => NextResponse.json({ success: true, data: [], source: 'empty_schema' });
const schemaError = (msg: string) =>
  msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422');

const normalizeInvoice = (r: any) => ({
  nfact: r.nfact ?? r.Nfact ?? r.NFACT ?? r.id,
  date_fact: r.date_fact ?? r.Date_fact,
  nclient: r.nclient ?? r.Nclient ?? r.NCLIENT,
  client_name: r.client_name ?? r.raison_sociale ?? r.nom,
  montant_ht: r.montant_ht ?? r.Montant_ht,
  tva: r.tva ?? r.TVA ?? r.Tva,
  montant_ttc: r.montant_ttc ?? r.Montant_ttc ?? r.total_ttc,
  timbre: r.timbre ?? r.Timbre,
  statut: r.statut ?? r.Statut,
  marge: r.marge ?? r.Marge,
});

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
