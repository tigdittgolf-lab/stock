/**
 * Helper pour appeler exec_sql via l'API REST Supabase directement,
 * en contournant le schema cache du client JS.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function execSql(sql: string): Promise<any[]> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({ sql }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`exec_sql HTTP ${res.status}: ${err}`);
  }

  const data = await res.json();
  // exec_sql retourne un JSON array ou un objet JSON
  if (Array.isArray(data)) return data;
  if (typeof data === 'string') {
    try { return JSON.parse(data); } catch { return []; }
  }
  return [];
}
