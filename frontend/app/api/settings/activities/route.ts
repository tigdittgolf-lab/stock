import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

const schemaError = (msg: string) =>
  msg.includes('does not exist') || msg.includes('HTTP 404') || msg.includes('HTTP 400') || msg.includes('HTTP 422');

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  // 1. Backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/activities`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      console.warn(`[activities] Backend ${res.status}, fallback Supabase`);
    } catch {
      console.warn('[activities] Backend unavailable, fallback Supabase');
    }
  }

  // 2. Supabase direct
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    const rows = await readTable(tenant, 'activite');
    if (rows.length > 0) {
      console.log(`🔑 [activite] Colonnes pour ${tenant}:`, Object.keys(rows[0]));
      console.log(`🔑 [activite] Première ligne:`, rows[0]);
    }
    const data = rows.map((r: any) => {
      const keys = Object.keys(r);
      const find = (...names: string[]) => {
        for (const n of names) {
          const k = keys.find(k => k.toLowerCase() === n.toLowerCase());
          if (k !== undefined && r[k] !== null && r[k] !== undefined) return r[k];
        }
        return undefined;
      };
      return {
        id: find('id'),
        nom_entreprise: find('nom_entreprise', 'nom', 'raison_sociale', 'name'),
        adresse: find('adresse', 'address'),
        telephone: find('telephone', 'tel', 'phone', 'tel1', 'tel2', 'gsm', 'mobile', 'fax', 'Telephone', 'Tel'),
        email: find('email', 'mail', 'e_mail', 'E_mail', 'courriel', 'email1'),
        rc: find('rc', 'registre_commerce'),
        nif: find('nif'),
        nis: find('nis'),
        art: find('art'),
      };
    });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Erreur';
    if (schemaError(msg)) return NextResponse.json({ success: true, data: [] });
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
      const err = await res.text();
      return NextResponse.json({ success: false, error: `Backend error: ${res.status}` }, { status: res.status });
    } catch {
      console.warn('[activities POST] Backend unavailable');
    }
  }
  return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
}
