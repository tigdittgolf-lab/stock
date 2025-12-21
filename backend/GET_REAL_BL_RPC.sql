-- Fonction RPC pour récupérer les VRAIS bons de livraison de la base de données

CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nfact INTEGER,
  nclient VARCHAR,
  date_fact DATE,
  montant_ht NUMERIC,
  tva NUMERIC,
  created_at TIMESTAMP,
  client_name VARCHAR
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT 
      bl.nfact,
      bl.nclient,
      bl.date_fact,
      bl.montant_ht,
      bl.tva,
      bl.created_at,
      COALESCE(c.raison_sociale, bl.nclient) as client_name
    FROM %I.bl bl
    LEFT JOIN %I.client c ON c.nclient = bl.nclient
    ORDER BY bl.nfact DESC
  ', p_tenant, p_tenant);
END;
$$;

-- Fonction RPC pour récupérer les VRAIES factures de la base de données
CREATE OR REPLACE FUNCTION get_fact_list_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nfact INTEGER,
  nclient VARCHAR,
  date_fact DATE,
  montant_ht NUMERIC,
  tva NUMERIC,
  created_at TIMESTAMP,
  client_name VARCHAR
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY EXECUTE format('
    SELECT 
      f.nfact,
      f.nclient,
      f.date_fact,
      f.montant_ht,
      f.tva,
      f.created_at,
      COALESCE(c.raison_sociale, f.nclient) as client_name
    FROM %I.fact f
    LEFT JOIN %I.client c ON c.nclient = f.nclient
    ORDER BY f.nfact DESC
  ', p_tenant, p_tenant);
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_bl_list_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bl_list_by_tenant(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_fact_list_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_by_tenant(TEXT) TO anon;

-- Test
-- SELECT * FROM get_bl_list_by_tenant('2025_bu01');
-- SELECT * FROM get_fact_list_by_tenant('2025_bu01');