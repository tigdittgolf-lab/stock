import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;
const emptyOk = () => NextResponse.json({ success: true, data: [], source: 'empty' });

function normalizeArticle(r: any): any {
  const keys = Object.keys(r);
  const find = (...names: string[]) => {
    for (const n of names) {
      const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
      if (k !== undefined && r[k] !== null && r[k] !== undefined) return r[k];
    }
    return undefined;
  };
  return {
    ...r,
    narticle: find('narticle', 'code_article', 'id') || '',
    designation: find('designation', 'libelle', 'nom_article') || '',
    prix_vente: parseFloat(find('prix_vente', 'prix', 'pu', 'prix_unitaire')?.toString() || '0') || 0,
    tva: parseFloat(find('tva', 'taux_tva')?.toString() || '0') || 0,
    stock_f: parseFloat(find('stock_f', 'stock_facture', 'stock')?.toString() || '0') || 0,
    stock_bl: parseFloat(find('stock_bl', 'stock_livraison')?.toString() || '0') || 0,
  };
}

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/articles`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[articles] Backend unavailable'); }
  }

  if (dbType !== 'supabase') return emptyOk();

  try {
    const rows = await readTable(tenant, 'article');
    const data = rows.map(normalizeArticle);
    return NextResponse.json({ success: true, data, count: data.length, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400')) return emptyOk();
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/articles`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { console.warn('[articles POST] Backend unavailable'); }
  }

  return NextResponse.json({ success: false, error: 'Backend non disponible pour la création' }, { status: 503 });
}
