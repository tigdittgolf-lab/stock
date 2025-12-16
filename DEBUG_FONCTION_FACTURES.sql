-- =====================================================
-- FONCTION DEBUG pour identifier le problème exact
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Fonction de debug détaillée
CREATE OR REPLACE FUNCTION debug_fact_function(p_tenant TEXT) 
RETURNS JSON AS $$
DECLARE
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
  row_count INTEGER;
  sample_data JSON;
  error_msg TEXT;
BEGIN
  -- Étape 1: Vérifier le schéma
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  -- Étape 2: Vérifier la table
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  -- Étape 3: Compter les lignes
  IF table_exists THEN
    BEGIN
      EXECUTE format('SELECT COUNT(*) FROM %I.fact', p_tenant) INTO row_count;
    EXCEPTION
      WHEN OTHERS THEN
        row_count := -1;
        error_msg := SQLERRM;
    END;
  ELSE
    row_count := 0;
  END IF;
  
  -- Étape 4: Récupérer un échantillon de données
  IF table_exists AND row_count > 0 THEN
    BEGIN
      EXECUTE format('
        SELECT json_agg(
          json_build_object(
            ''nfact'', nfact,
            ''nclient'', nclient,
            ''montant_ht'', montant_ht,
            ''montant_ht_type'', pg_typeof(montant_ht),
            ''tva'', tva,
            ''tva_type'', pg_typeof(tva)
          )
        ) 
        FROM %I.fact 
        LIMIT 2
      ', p_tenant) INTO sample_data;
    EXCEPTION
      WHEN OTHERS THEN
        sample_data := NULL;
        error_msg := SQLERRM;
    END;
  END IF;
  
  -- Retourner toutes les informations de debug
  RETURN json_build_object(
    'tenant', p_tenant,
    'schema_exists', schema_exists,
    'table_exists', table_exists,
    'row_count', row_count,
    'sample_data', sample_data,
    'error_message', error_msg
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'tenant', p_tenant,
      'global_error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour tester la requête exacte qui pose problème
CREATE OR REPLACE FUNCTION test_exact_query(p_tenant TEXT) 
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Tester la requête exacte de get_fact_list_enriched
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nfact'', nfact,
        ''nclient'', nclient,
        ''date_fact'', date_fact,
        ''montant_ht'', CAST(montant_ht AS NUMERIC),
        ''tva'', CAST(tva AS NUMERIC),
        ''total_ttc'', CAST(montant_ht AS NUMERIC) + CAST(tva AS NUMERIC),
        ''created_at'', created_at
      )
    ) 
    FROM %I.fact 
    ORDER BY nfact DESC
  ', p_tenant) INTO result;
  
  RETURN json_build_object(
    'success', true,
    'data', result,
    'message', 'Query executed successfully'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'message', 'Query failed'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION debug_fact_function TO anon, authenticated;
GRANT EXECUTE ON FUNCTION test_exact_query TO anon, authenticated;