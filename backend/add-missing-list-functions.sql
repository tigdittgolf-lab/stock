-- Fonctions manquantes pour lister les factures
-- À exécuter dans l'éditeur SQL de Supabase

-- Fonction pour récupérer la liste des factures
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
  
  -- Récupérer les factures
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM %I.fact ORDER BY nfact DESC) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour récupérer une facture par ID
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
  
  -- Récupérer la facture
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I.fact WHERE nfact = $1) t', p_tenant) 
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
COMMENT ON FUNCTION get_fact_list IS 'Récupère la liste des factures pour un tenant avec vérifications';
COMMENT ON FUNCTION get_fact_by_id IS 'Récupère une facture par ID pour un tenant avec vérifications';