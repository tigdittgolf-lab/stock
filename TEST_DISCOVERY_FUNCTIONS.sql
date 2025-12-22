-- =====================================================
-- TEST DES FONCTIONS DE DÉCOUVERTE
-- Exécutez ceci dans Supabase SQL Editor pour vérifier
-- =====================================================

-- Test 1: Vérifier si les fonctions existent
SELECT proname as function_name 
FROM pg_proc 
WHERE proname IN (
  'discover_tenant_schemas',
  'discover_schema_tables', 
  'discover_table_structure',
  'get_all_table_data'
);

-- Test 2: Découvrir les schémas
SELECT 'SCHÉMAS DÉCOUVERTS:' as test;
SELECT discover_tenant_schemas() as schemas;

-- Test 3: Découvrir les tables (remplacez '2025_bu01' par votre schéma réel)
SELECT 'TABLES DANS 2025_bu01:' as test;
SELECT discover_schema_tables('2025_bu01') as tables;

-- Test 4: Analyser une table spécifique
SELECT 'STRUCTURE TABLE ARTICLE:' as test;
SELECT discover_table_structure('2025_bu01', 'article') as structure;

-- Test 5: Vérifier les schémas existants manuellement
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE '%_bu%' 
ORDER BY schema_name;

-- Test 6: Vérifier les tables dans un schéma manuellement
SELECT table_name
FROM information_schema.tables 
WHERE table_schema = '2025_bu01' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- INSTRUCTIONS
-- =====================================================
-- 1. Exécutez ce script dans Supabase SQL Editor
-- 2. Vérifiez que les 4 fonctions existent
-- 3. Notez quels schémas sont découverts
-- 4. Notez quelles tables sont dans chaque schéma
-- 5. Partagez les résultats pour que je puisse corriger la migration