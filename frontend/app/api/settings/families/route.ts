import { NextRequest, NextResponse } from 'next/server';
import { readTable } from '@/lib/supabase-rpc';

const BACKEND_URL = process.env.BACKEND_URL;

export async function GET(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || request.headers.get('x-tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || request.headers.get('x-database-type') || 'supabase';

  // 1. Try backend
  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/families`, {
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'ngrok-skip-browser-warning': 'true' },
        signal: AbortSignal.timeout(5000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  // 2. Supabase direct — try famille then famille_article
  if (dbType !== 'supabase') {
    return NextResponse.json({ success: true, data: [] });
  }

  try {
    let rows: any[] = [];
    // Try all known table names for families across different schema versions
    for (const tbl of ['famille_art', 'famille', 'famille_article', 'familles', 'family']) {
      try { rows = await readTable(tenant, tbl); if (rows.length > 0) break; } catch { /* try next */ }
    }

    // If still empty, extract unique families from article table
    if (rows.length === 0) {
      try {
        const artRows = await readTable(tenant, 'article');
        const families = new Set<string>();
        artRows.forEach((a: any) => {
          const keys = Object.keys(a);
          const k = keys.find(k => k.toLowerCase() === 'famille');
          if (k && a[k]) families.add(String(a[k]).trim());
        });
        const data = [...families].sort().map(f => ({ id: f, nom: f, famille: f, code: f }));
        return NextResponse.json({ success: true, data, source: 'article_families' });
      } catch { /* fall through */ }
    }

    const data = rows.map((r: any) => {
      const keys = Object.keys(r);
      const fv = (...names: string[]) => { for (const n of names) { const k = keys.find(k => k.toLowerCase() === n.toLowerCase()); if (k && r[k]) return r[k]; } return ''; };
      const nom = fv('famille', 'nom', 'libelle', 'designation', 'name');
      return {
        id: fv('id', 'code_famille', 'code') || nom,
        nom,
        famille: nom,  // keep 'famille' field for backward compatibility with settings page
        code: fv('code_famille', 'code', 'id') || nom,
      };
    }).filter(d => d.nom);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    // Return empty — families are optional
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest) {
  const tenant = request.headers.get('X-Tenant') || '2025_bu01';
  const dbType = request.headers.get('X-Database-Type') || 'supabase';
  const body = await request.json();

  if (BACKEND_URL) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/settings/families`, {
        method: 'POST',
        headers: { 'X-Tenant': tenant, 'X-Database-Type': dbType, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) return NextResponse.json(await res.json());
    } catch { /* fall through */ }
  }

  return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
}
