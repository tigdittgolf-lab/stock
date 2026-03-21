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
 * Lit une seule ligne par ID via RPC get_row_by_id (rapide) ou fallback readTable.
 * Essaie les colonnes nfact, nbl, id dans l'ordre.
 */
export async function readTableById(schema: string, table: string, idValue: number | string): Promise<any | null> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_row_by_id`;
  // Essayer les colonnes candidates dans l'ordre
  for (const col of ['nfact', 'nbl', 'id']) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          p_schema_name: schema,
          p_table_name: table,
          p_id_column: col,
          p_id_value: String(idValue),
        }),
      });
      if (res.ok) {
        const result = await res.json();
        // get_row_by_id retourne JSON — Supabase l'enveloppe dans [value]
        let row = result;
        if (Array.isArray(result) && result.length === 1) row = result[0];
        if (row && typeof row === 'object' && !Array.isArray(row)) return row;
      }
    } catch { /* continuer */ }
  }
  // Fallback: charger toute la table
  const rows = await readTable(schema, table);
  return rows.find((r: any) => {
    const keys = Object.keys(r);
    for (const candidate of ['nfact', 'nbl', 'id']) {
      const k = keys.find(k => k.toLowerCase() === candidate);
      if (k && r[k] == idValue) return true;
    }
    return false;
  }) ?? null;
}

/**
 * Lit les lignes d'une table filtrées par une colonne via RPC get_table_rows_where.
 */
export async function readTableWhere(schema: string, table: string, column: string, value: number | string): Promise<any[]> {
  const url = `${SUPABASE_URL}/rest/v1/rpc/get_table_rows_where`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_schema_name: schema,
        p_table_name: table,
        p_id_column: column,
        p_id_value: String(value),
      }),
    });
    if (res.ok) {
      const result = await res.json();
      // get_table_rows_where retourne JSON — Supabase l'enveloppe dans [value]
      if (Array.isArray(result)) {
        // Cas 1: tableau direct de lignes
        if (result.length > 0 && typeof result[0] === 'object' && result[0] !== null && !Array.isArray(result[0])) {
          return result;
        }
        // Cas 2: Supabase enveloppe le JSON dans un tableau à un élément
        if (result.length === 1) {
          const inner = result[0];
          if (Array.isArray(inner)) return inner;
          if (inner === null) return [];
        }
        if (result.length === 0) return [];
        return result;
      }
      // Cas 3: retour direct d'un tableau JSON (pas enveloppé)
      if (result && typeof result === 'object' && !Array.isArray(result)) return [result];
    }
  } catch (e) {
    console.warn(`[readTableWhere] RPC failed for ${schema}.${table} WHERE ${column}=${value}:`, e);
  }
  // Fallback: charger toute la table et filtrer
  console.warn(`[readTableWhere] Fallback readTable pour ${schema}.${table}`);
  const rows = await readTable(schema, table);
  return rows.filter((r: any) => {
    const keys = Object.keys(r);
    const k = keys.find(k => k.toLowerCase() === column.toLowerCase());
    return k && r[k] == value;
  });
}

/**
 * Alias pour compatibilité — utilise readTable.
 */
export async function execSql(sqlQuery: string, _params: string[] = []): Promise<any[]> {
  // Pour les SELECT simples sur une table tenant, on délègue à readTable
  // Cette fonction n'est plus utilisée directement mais gardée pour compatibilité
  throw new Error('execSql: use readTable instead');
}
