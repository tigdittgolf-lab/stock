import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  // 1. Try backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/purchases/delivery-notes`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(8000),
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  // 2. Supabase direct — try RPC then readTable
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: true, data: [], source: 'empty' });
  }

  try {
    // Try RPC get_purchase_delivery_notes first
    try {
      const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_purchase_delivery_notes`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ p_tenant: tenant }),
        signal: AbortSignal.timeout(8000),
      });
      if (rpcRes.ok) {
        const result = await rpcRes.json();
        const data = Array.isArray(result) ? result : (result ? [result] : []);
        return NextResponse.json({ success: true, data, source: 'supabase_rpc' });
      }
    } catch { /* try readTable */ }

    // Fallback: readTable bl_achat
    const rows = await readTable(tenant, 'bl_achat');
    const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
    const fv = (r: any, ...names: string[]) => {
      for (const n of names) {
        const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
        if (k && r[k] != null) return r[k];
      }
      return undefined;
    };

    const data = rows.map((r: any) => ({
      nbl_achat: fv(r, 'nbl_achat', 'id'),
      nfournisseur: fv(r, 'nfournisseur', 'supplier_code'),
      supplier_name: fv(r, 'supplier_name', 'nom_fournisseur', 'nfournisseur'),
      numero_bl_fournisseur: fv(r, 'numero_bl_fournisseur', 'num_bl', 'reference'),
      date_bl: fv(r, 'date_bl', 'date_fact', 'date'),
      montant_ht: parseFloat(fv(r, 'montant_ht', 'mht') || 0),
      tva: parseFloat(fv(r, 'tva', 'montant_tva') || 0),
      total_ttc: parseFloat(fv(r, 'total_ttc', 'montant_ttc', 'mttc') || 0) ||
        (parseFloat(fv(r, 'montant_ht', 'mht') || 0) + parseFloat(fv(r, 'tva', 'montant_tva') || 0)),
    }));

    return NextResponse.json({ success: true, data, source: 'supabase_direct' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400')) {
      return NextResponse.json({ success: true, data: [], source: 'empty' });
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
      const res = await fetch(`${BACKEND_URL}/api/purchases/delivery-notes`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(10000),
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  return NextResponse.json({ success: false, error: 'Backend non disponible pour la création' }, { status: 503 });
}
