-- =====================================================
-- FONCTION AMÉLIORÉE avec debug pour les factures
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Fonction améliorée avec plus de debug
CREATE OR REPLACE FUNCTION get_fact_list_enriched_debug(p_tenant TEXT) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
  row_count INTEGER;
  debug_info JSON;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object(
          'error', 'Schema not found',
          'schema', p_tenant,
          'schema_exists', schema_exists
      );
  END IF;
  
  -- Vérifier si la table fact existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN json_build_object(
          'error', 'Table fact not found',
          'schema', p_tenant,
          'schema_exists', schema_exists,
          'table_exists', table_exists
      );
  END IF;
  
  -- Compter les lignes
  EXECUTE format('SELECT COUNT(*) FROM %I.fact', p_tenant) INTO row_count;
  
  IF row_count = 0 THEN
      RETURN json_build_object(
          'error', 'No data in fact table',
          'schema', p_tenant,
          'schema_exists', schema_exists,
          'table_exists', table_exists,
          'row_count', row_count
      );
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
        ''total_ttc'', montant_ht + tva,
        ''created_at'', created_at
      )
    ) 
    FROM %I.fact 
    ORDER BY nfact DESC
  ', p_tenant) INTO result;
  
  -- Ajouter des infos de debug
  SELECT json_build_object(
      'data', COALESCE(result, '[]'::json),
      'debug', json_build_object(
          'schema', p_tenant,
          'schema_exists', schema_exists,
          'table_exists', table_exists,
          'row_count', row_count
      )
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object(
          'error', 'Exception occurred',
          'message', SQLERRM,
          'schema', p_tenant
      );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_fact_list_enriched_debug TO anon, authenticated;

-- Test de la fonction debug
-- SELECT get_fact_list_enriched_debug('2025_bu01');