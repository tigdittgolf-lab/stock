import { NextRequest, NextResponse } from 'next/server';
import { execSql } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/clients`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[clients] Backend unavailable, using Supabase direct');
    }
  }

  try {
    if (dbType !== 'supabase') return NextResponse.json({ success: true, data: [] });

    const rows = await execSql(`SELECT * FROM "${tenant}".client ORDER BY "Nclient" ASC`);
    const data = rows.map((c: any) => ({
      nclient: c.Nclient || c.nclient,
      raison_sociale: c.Raison_sociale || c.raison_sociale,
      adresse: c.adresse || c.Adresse,
      contact_person: c.contact_person || c.Contact_person,
      tel: c.Tel || c.tel,
      email: c.email || c.Email,
      nrc: c.NRC || c.nrc,
      date_rc: c.Date_RC || c.date_rc,
      lieu_rc: c.Lieu_RC || c.lieu_rc,
      i_fiscal: c.I_Fiscal || c.i_fiscal,
      n_article: c.N_article || c.n_article,
      c_affaire_fact: c.C_affaire_fact || c.c_affaire_fact,
      c_affaire_bl: c.C_affaire_bl || c.c_affaire_bl,
      commentaire: c.Commentaire || c.commentaire
    }));
    console.log(`✅ [clients direct] ${data.length} for ${tenant}`);
    return NextResponse.json({ success: true, data, source: 'supabase_direct' });
  } catch (error) {
    console.error('❌ clients direct error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/clients`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch (e) {
      console.warn('[clients POST] Backend unavailable');
    }
  }
  return NextResponse.json({ success: false, error: 'Backend not available' }, { status: 503 });
}
