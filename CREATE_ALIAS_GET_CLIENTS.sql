-- Créer un alias pour get_clients_by_tenant qui utilise la version SIMPLE (sans dette)
-- Pour éviter les timeouts avec 1000 clients
DROP FUNCTION IF EXISTS get_clients_by_tenant(TEXT);

CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nclient VARCHAR,
  raison_sociale VARCHAR,
  adresse VARCHAR,
  telephone VARCHAR,
  email VARCHAR,
  c_affaire_fact NUMERIC,
  c_affaire_bl NUMERIC,
  chiffre_affaire NUMERIC,
  solde NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gcs.nclient,
    gcs.raison_sociale,
    gcs.adresse,
    gcs.tel as telephone,
    gcs.email,
    gcs.c_affaire_fact,
    gcs.c_affaire_bl,
    gcs.chiffre_affaire,
    gcs.solde
  FROM get_clients_simple(p_tenant) gcs;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_clients_by_tenant TO anon, authenticated;
