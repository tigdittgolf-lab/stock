import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function supabaseFrom(table: string, query: Record<string, string> = {}) {
  const params = new URLSearchParams({ select: '*', ...query });
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${params}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Supabase ${table} HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

async function supabaseInsert(table: string, body: object) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase insert ${table} HTTP ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  // Essayer le backend d'abord
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/credit-notes`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[credit-notes] Backend ${res.status}, fallback Supabase direct`);
    } catch {
      console.warn('[credit-notes] Backend unavailable, using Supabase direct');
    }
  }

  // Fallback Supabase direct
  try {
    if (dbType !== 'supabase') return NextResponse.json({ success: true, data: [] });
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant requis' }, 400);

    const data = await supabaseFrom('avoir', { 'tenant': `eq.${tenant}`, order: 'date_avoir.desc' });
    return NextResponse.json({ success: true, data: data || [], source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400')) {
      return NextResponse.json({ success: true, data: [], source: 'empty' });
    }
    console.error('❌ credit-notes GET error:', error);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  // Essayer le backend d'abord
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/sales/credit-notes`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[credit-notes POST] Backend ${res.status}, fallback Supabase direct`);
    } catch {
      console.warn('[credit-notes POST] Backend unavailable, using Supabase direct');
    }
  }

  // Fallback Supabase direct
  try {
    if (dbType !== 'supabase') return NextResponse.json({ success: false, error: 'Backend requis pour MySQL/PostgreSQL' }, 503);
    if (!tenant) return NextResponse.json({ success: false, error: 'Tenant requis' }, 400);

    const { nclient, document_type, document_ref, date_avoir, motif, lines } = body;
    if (!nclient || !document_type || !document_ref || !lines?.length) {
      return NextResponse.json({ success: false, error: 'Données manquantes' }, 400);
    }

    // Calculer les totaux
    let montant_ht = 0, tva_total = 0;
    for (const l of lines) {
      const ht = l.qte * l.prix;
      montant_ht += ht;
      tva_total += ht * (l.tva / 100);
    }
    const montant_ttc = montant_ht + tva_total;

    // Insérer l'avoir
    const [avoir] = await supabaseInsert('avoir', {
      tenant,
      nclient,
      date_avoir: date_avoir || new Date().toISOString().split('T')[0],
      document_type,
      document_ref,
      montant_ht,
      tva: tva_total,
      montant_ttc,
      motif: motif || null,
    });

    if (!avoir?.id) return NextResponse.json({ success: false, error: 'Erreur insertion avoir' }, 500);

    // Insérer les détails
    const details = lines.map((l: any) => ({
      avoir_id: avoir.id,
      narticle: l.narticle,
      qte: l.qte,
      prix: l.prix,
      tva: l.tva,
      total_ligne: l.qte * l.prix * (1 + l.tva / 100),
    }));
    await supabaseInsert('detail_avoir', details);

    // Remettre le stock via RPC exec_sql
    const stockCol = document_type === 'bl' ? 'stock_bl' : 'stock_f';
    for (const l of lines) {
      await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sql: `UPDATE "${tenant}"."article" SET "${stockCol}" = COALESCE("${stockCol}", 0) + ${l.qte} WHERE "Narticle" = '${l.narticle}'`
        }),
      });
    }

    return NextResponse.json({
      success: true,
      message: `Avoir N°${avoir.id} créé avec succès`,
      data: { avoir_id: avoir.id, montant_ht, tva: tva_total, montant_ttc },
    });

  } catch (error) {
    console.error('❌ credit-notes POST error:', error);
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Erreur' }, { status: 500 });
  }
}
