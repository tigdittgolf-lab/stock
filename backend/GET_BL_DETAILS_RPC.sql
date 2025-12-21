-- Fonction RPC pour récupérer les détails d'un BL spécifique

CREATE OR REPLACE FUNCTION get_bl_with_details(
  p_tenant TEXT,
  p_nfact INTEGER
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  -- Récupérer le BL avec ses détails
  EXECUTE format('
    SELECT json_build_object(
      ''nbl'', bl.nfact,
      ''nclient'', bl.nclient,
      ''client_name'', COALESCE(c.raison_sociale, bl.nclient),
      ''client_address'', COALESCE(c.adresse, ''''),
      ''date_fact'', bl.date_fact,
      ''montant_ht'', COALESCE(bl.montant_ht, 0),
      ''tva'', COALESCE(bl.tva, 0),
      ''montant_ttc'', COALESCE(bl.montant_ht + bl.tva, 0),
      ''created_at'', bl.created_at,
      ''details'', COALESCE((
        SELECT json_agg(
          json_build_object(
            ''narticle'', dbl.narticle,
            ''designation'', COALESCE(a.designation, dbl.narticle),
            ''qte'', dbl.qte,
            ''prix'', dbl.prix,
            ''tva'', dbl.tva,
            ''total_ligne'', dbl.total_ligne
          )
        )
        FROM %I.detail_bl dbl
        LEFT JOIN %I.article a ON a.narticle = dbl.narticle
        WHERE dbl.nfact = bl.nfact
      ), ''[]''::json)
    )
    FROM %I.bl bl
    LEFT JOIN %I.client c ON c.nclient = bl.nclient
    WHERE bl.nfact = $1
  ', p_tenant, p_tenant, p_tenant, p_tenant) 
  INTO result
  USING p_nfact;

  RETURN COALESCE(result, '{"error": "BL not found"}'::json);

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_bl_with_details(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bl_with_details(TEXT, INTEGER) TO anon;

-- Test
-- SELECT get_bl_with_details('2025_bu01', 5);