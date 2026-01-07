-- Créer la fonction RPC pour récupérer les proformas depuis la table fprof
CREATE OR REPLACE FUNCTION get_proforma_list(p_tenant TEXT)
RETURNS TABLE(
  nfprof INTEGER,
  nclient TEXT,
  client_name TEXT,
  date_fact DATE,
  montant_ht DECIMAL,
  tva DECIMAL,
  montant_ttc DECIMAL,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  EXECUTE format('
    SELECT 
      f.nfprof,
      f.nclient,
      COALESCE(c.raison_sociale, ''Client '' || f.nclient) as client_name,
      f.date_fact,
      f.montant_ht,
      f.tva,
      f.montant_ttc,
      f.created_at
    FROM %I.fprof f
    LEFT JOIN %I.client c ON f.nclient = c.nclient
    ORDER BY f.nfprof DESC
  ', p_tenant, p_tenant);
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_proforma_list(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_proforma_list(TEXT) TO anon;

-- Test de la fonction
SELECT * FROM get_proforma_list('2025_bu01');