/**
 * Helper pour accéder aux schémas tenant Supabase via RPC exec_sql.
 * La fonction exec_sql(sql_query TEXT, params TEXT[]) est SECURITY DEFINER
 * et peut accéder aux schémas non-public.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Exécute une requête SQL via la fonction RPC exec_sql dans Supabase.
 * Retourne un tableau de lignes.
 */
export async function execSql(sqlQuery: string, params: string[] = []): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ sql_query: sqlQuery, params }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`execSql HTTP ${res.status}: ${err}`);
  }

  const result = await res.json();

  // exec_sql retourne un JSONB — peut être un objet {success, data} ou directement un tableau
  if (Array.isArray(result)) return result;
  if (result && Array.isArray(result.data)) return result.data;
  if (result && result.success === false) throw new Error(result.error || 'exec_sql failed');

  // Parfois Supabase enveloppe dans un tableau à un élément
  if (Array.isArray(result) && result.length === 1 && Array.isArray(result[0])) return result[0];

  return [];
}

/**
 * Lit une table dans un schéma tenant via exec_sql.
 * @deprecated Utiliser execSql directement avec une requête SQL explicite.
 */
export async function readTable(schema: string, table: string, orderBy?: string): Promise<any[]> {
  const order = orderBy ? ` ORDER BY "${orderBy}"` : '';
  const sql = `SELECT * FROM "${schema}"."${table}"${order}`;
  return execSql(sql);
}
