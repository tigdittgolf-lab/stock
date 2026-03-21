import { NextRequest, NextResponse } from 'next/server';
import { execSql } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/suppliers`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[suppliers] Backend unavailable, using Supabase direct');
    }
  }

  try {
    if (dbType !== 'supabase') return NextResponse.json({ success: true, data: [] });

    const rows = await execSql(`SELECT * FROM "${tenant}".fournisseur ORDER BY nfournisseur ASC`);
    const data = rows.map((s: any) => ({
      nfournisseur: s.Nfournisseur || s.nfournisseur,
      nom_fournisseur: s.nom_fournisseur || s.Nom_fournisseur,
      resp_fournisseur: s.resp_fournisseur || s.Resp_fournisseur,
      adresse_fourni: s.adresse_fourni || s.Adresse_fourni,
      tel: s.tel || s.Tel,
      tel1: s.tel1 || s.Tel1,
      tel2: s.tel2 || s.Tel2,
      caf: s.caf || s.CAF,
      cabl: s.cabl || s.CABL,
      email: s.email || s.Email,
      commentaire: s.commentaire || s.Commentaire
    }));
    console.log(`✅ [suppliers direct] ${data.length} for ${tenant}`);
    return NextResponse.json({ success: true, data, source: 'supabase_direct' });
  } catch (error) {
    console.error('❌ suppliers direct error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/suppliers`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[suppliers POST] Backend unavailable');
    }
  }
  return NextResponse.json({ success: false, error: 'Backend not available' }, { status: 503 });
}
