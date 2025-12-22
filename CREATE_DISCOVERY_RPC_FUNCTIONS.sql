-- =====================================================
-- FONCTIONS RPC POUR DÉCOUVERTE COMPLÈTE
-- Exécutez ceci dans Supabase SQL Editor AVANT la migration
-- =====================================================

-- 1. Fonction pour découvrir tous les schémas tenant
CREATE OR REPLACE FUNCTION discover_tenant_schemas()
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(schema_name ORDER BY schema_name) INTO result
  FROM information_schema.schemata 
  WHERE schema_name LIKE '%_bu%';
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 2. Fonction pour découvrir toutes les tables d'un schéma
CREATE OR REPLACE FUNCTION discover_schema_tables(p_schema_name TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(json_build_object(
      ''table_name'', table_name,
      ''table_type'', table_type
    ) ORDER BY table_name)
    FROM information_schema.tables 
    WHERE table_schema = %L 
      AND table_type = ''BASE TABLE''
  ', p_schema_name) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 3. Fonction pour découvrir la structure complète d'une table
CREATE OR REPLACE FUNCTION discover_table_structure(p_schema_name TEXT, p_table_name TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  columns_result JSON;
  constraints_result JSON;
  count_result INTEGER;
  sample_result JSON;
  final_result JSON;
BEGIN
  -- Récupérer les colonnes
  EXECUTE format('
    SELECT json_agg(json_build_object(
      ''column_name'', column_name,
      ''data_type'', data_type,
      ''character_maximum_length'', character_maximum_length,
      ''is_nullable'', is_nullable,
      ''column_default'', column_default,
      ''ordinal_position'', ordinal_position
    ) ORDER BY ordinal_position)
    FROM information_schema.columns
    WHERE table_schema = %L AND table_name = %L
  ', p_schema_name, p_table_name) INTO columns_result;

  -- Récupérer les contraintes
  EXECUTE format('
    SELECT json_agg(json_build_object(
      ''constraint_name'', tc.constraint_name,
      ''constraint_type'', tc.constraint_type,
      ''column_name'', kcu.column_name
    ))
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_schema = %L AND tc.table_name = %L
  ', p_schema_name, p_table_name) INTO constraints_result;

  -- Compter les enregistrements
  EXECUTE format('SELECT COUNT(*) FROM %I.%I', p_schema_name, p_table_name) INTO count_result;

  -- Récupérer un échantillon de données (2 lignes max)
  EXECUTE format('
    SELECT json_agg(t) FROM (
      SELECT * FROM %I.%I LIMIT 2
    ) t
  ', p_schema_name, p_table_name) INTO sample_result;

  -- Construire le résultat final
  SELECT json_build_object(
    'table_name', p_table_name,
    'columns', COALESCE(columns_result, '[]'::json),
    'constraints', COALESCE(constraints_result, '[]'::json),
    'record_count', count_result,
    'sample_data', COALESCE(sample_result, '[]'::json)
  ) INTO final_result;

  RETURN final_result;
END;
$$ LANGUAGE plpgsql;

-- 4. Fonction pour récupérer toutes les données d'une table
CREATE OR REPLACE FUNCTION get_all_table_data(p_schema_name TEXT, p_table_name TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(t) FROM (
      SELECT * FROM %I.%I ORDER BY 1
    ) t
  ', p_schema_name, p_table_name) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION discover_tenant_schemas() TO authenticated;
GRANT EXECUTE ON FUNCTION discover_schema_tables(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION discover_table_structure(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_table_data(TEXT, TEXT) TO authenticated;

-- =====================================================
-- TESTS
-- =====================================================

-- Test 1: Découvrir les schémas
SELECT discover_tenant_schemas();

-- Test 2: Découvrir les tables d'un schéma
SELECT discover_schema_tables('2025_bu01');

-- Test 3: Analyser une table
SELECT discover_table_structure('2025_bu01', 'article');

-- =====================================================
-- MESSAGE DE SUCCÈS
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Fonctions de découverte créées avec succès!';
  RAISE NOTICE '🔧 4 fonctions RPC disponibles pour la découverte complète';
  RAISE NOTICE '🚀 Vous pouvez maintenant lancer la migration VRAIE';
END $$;