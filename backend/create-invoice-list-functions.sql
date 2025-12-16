-- Fonctions RPC pour récupérer les détails des factures
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Fonction pour récupérer les détails d'une facture avec articles
CREATE OR REPLACE FUNCTION get_fact_with_details(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $
DECLARE
  result JSON;
  fact_data JSON;
  details_data JSON;
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
  
  -- Vérifier si les tables existent
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer la facture
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I.fact WHERE nfact = $1) t', p_tenant) 
  USING p_nfact INTO fact_data;
  
  IF fact_data IS NULL THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer les détails
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM %I.detail_fact WHERE nfact = $1) t', p_tenant) 
  USING p_nfact INTO details_data;
  
  -- Combiner les données
  SELECT json_build_object(
      'nfact', (fact_data->>'nfact')::INTEGER,
      'nclient', fact_data->>'nclient',
      'date_fact', fact_data->>'date_fact',
      'montant_ht', (fact_data->>'montant_ht')::DECIMAL,
      'tva', (fact_data->>'tva')::DECIMAL,
      'total_ttc', (fact_data->>'montant_ht')::DECIMAL + (fact_data->>'tva')::DECIMAL,
      'created_at', fact_data->>'created_at',
      'details', COALESCE(details_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour récupérer la liste des factures avec totaux corrects
CREATE OR REPLACE FUNCTION get_fact_list_enriched(p_tenant TEXT) 
RETURNS JSON AS $
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
        ''total_ttc'', montant_ht + tva,
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
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_fact_with_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_enriched TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_fact_with_details IS 'Récupère une facture avec ses détails pour un tenant';
COMMENT ON FUNCTION get_fact_list_enriched IS 'Récupère la liste des factures avec totaux calculés pour un tenant';