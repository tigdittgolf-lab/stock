-- Créer un alias pour get_clients_by_tenant qui utilise la nouvelle fonction avec dette
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
    gcd.nclient,
    gcd.raison_sociale,
    gcd.adresse,
    gcd.tel as telephone,
    gcd.email,
    gcd.c_affaire_fact,
    gcd.c_affaire_bl,
    gcd.chiffre_affaire,
    gcd.solde
  FROM get_clients_with_debt(p_tenant) gcd;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_clients_by_tenant TO anon, authenticated;
