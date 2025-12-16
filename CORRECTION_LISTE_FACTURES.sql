-- =====================================================
-- CORRECTION FINALE pour get_fact_list_enriched
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Fonction corrigée pour la liste des factures (sans ORDER BY dans json_agg)
CREATE OR REPLACE FUNCTION get_fact_list_enriched(p_tenant TEXT) 
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
  
  -- Récupérer les factures (ORDER BY à l'extérieur de json_agg)
  EXECUTE format('
    SELECT json_agg(fact_json ORDER BY nfact DESC)
    FROM (
      SELECT 
        nfact,
        json_build_object(
          ''nfact'', nfact,
          ''nclient'', nclient,
          ''date_fact'', date_fact,
          ''montant_ht'', montant_ht,
          ''tva'', tva,
          ''total_ttc'', montant_ht + tva,
          ''created_at'', created_at
        ) as fact_json
      FROM %I.fact
    ) t
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_fact_list_enriched TO anon, authenticated;