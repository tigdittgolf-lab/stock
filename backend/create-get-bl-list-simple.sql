-- Fonction simple pour récupérer la liste des bons de livraison
-- Compatible avec l'endpoint GET /delivery-notes

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS get_bl_list_simple(TEXT);

-- Créer la nouvelle fonction simple
CREATE OR REPLACE FUNCTION get_bl_list_simple(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR(50),
  client_name VARCHAR(255),
  date_fact DATE,
  montant_ht DECIMAL(15,2),
  tva DECIMAL(15,2),
  montant_ttc DECIMAL(15,2),
  created_at TIMESTAMP
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que le tenant est fourni
  IF p_tenant IS NULL OR p_tenant = '' THEN
    RAISE EXCEPTION 'Tenant parameter is required';
  END IF;

  -- Retourner la liste des BL avec les informations client
  RETURN QUERY
  EXECUTE format('
    SELECT 
      bl.nfact,
      bl.nclient,
      COALESCE(c.raison_sociale, bl.nclient) as client_name,
      bl.date_fact,
      bl.montant_ht,
      bl.tva,
      (bl.montant_ht + bl.tva) as montant_ttc,
      bl.created_at
    FROM %I.bl bl
    LEFT JOIN %I.clients c ON c.nclient = bl.nclient
    ORDER BY bl.nfact DESC
  ', p_tenant, p_tenant);
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error fetching BL list for tenant %: %', p_tenant, SQLERRM;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_bl_list_simple TO anon, authenticated;

-- Commentaire
COMMENT ON FUNCTION get_bl_list_simple IS 'Récupère la liste simple des bons de livraison pour un tenant';