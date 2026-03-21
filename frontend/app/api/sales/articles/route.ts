import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/articles`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[articles] Backend responded ${res.status}, falling back to Supabase direct`);
    } catch (e) {
      console.warn('[articles] Backend unavailable, using Supabase direct');
    }
  }

  try {
    if (dbType !== 'supabase') return NextResponse.json({ success: true, data: [] });

    const rows = await readTable(tenant, 'article');
    const data = rows.map((a: any) => ({
      narticle: a.Narticle || a.narticle,
      famille: a.famille || a.Famille,
      designation: a.designation || a.Designation,
      nfournisseur: a.Nfournisseur || a.nfournisseur,
      prix_unitaire: a.prix_unitaire || a.Prix_unitaire,
      marge: a.marge || a.Marge,
      tva: a.TVA || a.tva,
      prix_vente: a.prix_vente || a.Prix_vente,
      seuil: a.seuil || a.Seuil,
      stock_f: a.stock_f || a.Stock_f,
      stock_bl: a.stock_bl || a.Stock_bl
    }));
    console.log(`✅ [articles direct] ${data.length} for ${tenant}`);
    return NextResponse.json({ success: true, data, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    // Schéma inexistant → retourner tableau vide plutôt que 500
    if (msg.includes('does not exist') || msg.includes('n\'existe pas') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422')) {
      console.warn(`⚠️ [articles] Schéma ${tenant} introuvable dans Supabase, retour tableau vide`);
      return NextResponse.json({ success: true, data: [], source: 'empty_schema' });
    }
    console.error('❌ articles direct error:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/articles`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[articles POST] Backend unavailable');
    }
  }
  return NextResponse.json({ success: false, error: 'Backend not available' }, { status: 503 });
}
