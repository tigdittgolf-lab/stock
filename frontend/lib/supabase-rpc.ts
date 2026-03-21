/**
 * Helper pour lire des tables Supabase via l'API REST PostgREST
 * en utilisant Accept-Profile pour accéder aux schémas tenant.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Lit une table dans un schéma tenant via l'API REST Supabase.
 * Utilise Accept-Profile pour cibler le bon schéma.
 */
export async function readTable(schema: string, table: string, orderBy?: string): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}${orderBy ? `?order=${orderBy}` : ''}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Accept-Profile': schema,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`readTable ${schema}.${table} HTTP ${res.status}: ${err}`);
  }

  return res.json();
}
