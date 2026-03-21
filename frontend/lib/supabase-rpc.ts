/**
 * Helper pour accéder aux schémas tenant Supabase via RPC.
 * Utilise get_all_table_data(schema, table) qui est SECURITY DEFINER
 * et peut accéder aux schémas non-public.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

/**
 * Lit toutes les lignes d'une table dans un schéma tenant via RPC get_all_table_data.
 * Retourne un tableau de lignes (objets).
 */
export async function readTable(schema: string, table: string): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_all_table_data`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_schema_name: schema, p_table_name: table }),
  });

  if (!res.ok) {
    const err = await res.text();
    // Inclure le status dans le message pour faciliter la détection côté appelant
    throw new Error(`readTable ${schema}.${table} HTTP ${res.status}: ${err}`);
  }

  const result = await res.json();

  // get_all_table_data retourne un JSONB array directement
  if (Array.isArray(result)) return result;

  // Supabase enveloppe parfois dans un tableau à un élément contenant le JSONB
  if (Array.isArray(result) && result.length === 1 && Array.isArray(result[0])) return result[0];

  // Si c'est null ou vide
  return [];
}

/**
 * Alias pour compatibilité — utilise readTable.
 */
export async function execSql(sqlQuery: string, _params: string[] = []): Promise<any[]> {
  // Pour les SELECT simples sur une table tenant, on délègue à readTable
  // Cette fonction n'est plus utilisée directement mais gardée pour compatibilité
  throw new Error('execSql: use readTable instead');
}
