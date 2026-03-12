-- Fonction RPC simple pour récupérer les clients SANS calcul de dette
-- Utilisée pour les listes rapides (évite les timeouts)
DROP FUNCTION IF EXISTS get_clients_simple(TEXT);

CREATE OR REPLACE FUNCTION get_clients_simple(p_tenant TEXT)
RETURNS TABLE(
  nclient VARCHAR,
  raison_sociale VARCHAR,
  adresse VARCHAR,
  tel VARCHAR,
  email VARCHAR,
  c_affaire_fact NUMERIC,
  c_affaire_bl NUMERIC,
  chiffre_affaire NUMERIC,
  solde NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  sql_query := format('
    SELECT 
      c."Nclient"::VARCHAR,
      c."Raison_sociale"::VARCHAR,
      c.adresse::VARCHAR,
      c."Tel"::VARCHAR,
      c.email::VARCHAR,
      COALESCE(c."C_affaire_fact", 0)::NUMERIC as c_affaire_fact,
      COALESCE(c."C_affaire_bl", 0)::NUMERIC as c_affaire_bl,
      (COALESCE(c."C_affaire_fact", 0) + COALESCE(c."C_affaire_bl", 0))::NUMERIC as chiffre_affaire,
      0::NUMERIC as solde
    FROM %I.client c
    ORDER BY c."Nclient"
  ', p_tenant);
  
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_clients_simple TO anon, authenticated;
