-- EXÉCUTEZ CE CODE DANS L'ÉDITEUR SQL DE SUPABASE
-- Cela permettra d'afficher les vraies factures au lieu du fallback

-- Fonction pour récupérer la liste des factures avec les vraies données
CREATE OR REPLACE FUNCTION get_fact_list(p_tenant TEXT) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Vérifier si la table fact existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Récupérer les factures avec calcul du total TTC
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nfact'', nfact,
        ''nclient'', nclient,
        ''date_fact'', date_fact,
        ''montant_ht'', montant_ht,
        ''tva'', tva,
        ''total_ttc'', (montant_ht + tva),
        ''created_at'', created_at
      )
    ) 
    FROM %I.fact 
    ORDER BY nfact DESC
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer une facture par ID avec ses détails
CREATE OR REPLACE FUNCTION get_fact_by_id(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN NULL;
  END IF;
  
  -- Vérifier si la table fact existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer la facture avec ses détails
  EXECUTE format('
    SELECT json_build_object(
      ''nfact'', f.nfact,
      ''nclient'', f.nclient,
      ''date_fact'', f.date_fact,
      ''montant_ht'', f.montant_ht,
      ''tva'', f.tva,
      ''total_ttc'', (f.montant_ht + f.tva),
      ''created_at'', f.created_at,
      ''details'', COALESCE(
        (SELECT json_agg(
          json_build_object(
            ''narticle'', d.narticle,
            ''qte'', d.qte,
            ''prix'', d.prix,
            ''tva'', d.tva,
            ''total_ligne'', (d.qte * d.prix)
          )
        ) FROM %I.detail_fact d WHERE d.nfact = f.nfact),
        ''[]''::json
      )
    )
    FROM %I.fact f 
    WHERE f.nfact = $1
  ', p_tenant, p_tenant) 
  USING p_nfact INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_fact_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_by_id TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_fact_list IS 'Récupère la liste des factures avec calcul TTC';
COMMENT ON FUNCTION get_fact_by_id IS 'Récupère une facture par ID avec ses détails';