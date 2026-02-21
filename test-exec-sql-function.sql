-- ============================================================================
-- SCRIPT DE TEST: Vérifier que exec_sql fonctionne
-- ============================================================================
-- Exécuter ce script dans l'éditeur SQL Supabase APRÈS avoir créé les fonctions
-- https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql

-- Test 1: Vérifier que la fonction existe
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'exec_sql';
-- Résultat attendu: 1 ligne avec routine_name='exec_sql', routine_type='FUNCTION'

-- Test 2: Exécuter une requête simple
SELECT exec_sql('SELECT 1');
-- Résultat attendu: {"success": true}

-- Test 3: Créer un schéma de test
SELECT exec_sql('CREATE SCHEMA IF NOT EXISTS test_migration');
-- Résultat attendu: {"success": true}

-- Test 4: Créer une table de test
SELECT exec_sql('CREATE TABLE IF NOT EXISTS test_migration.test_table (id INT, name TEXT)');
-- Résultat attendu: {"success": true}

-- Test 5: Vérifier que la table existe
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'test_migration' AND table_name = 'test_table';
-- Résultat attendu: 1 ligne avec table_name='test_table'

-- Test 6: Insérer des données
SELECT exec_sql('INSERT INTO test_migration.test_table (id, name) VALUES (1, ''test'')');
-- Résultat attendu: {"success": true}

-- Test 7: Vérifier les données
SELECT * FROM test_migration.test_table;
-- Résultat attendu: 1 ligne avec id=1, name='test'

-- Nettoyage (optionnel)
SELECT exec_sql('DROP SCHEMA IF EXISTS test_migration CASCADE');
-- Résultat attendu: {"success": true}

-- ============================================================================
-- Si tous les tests passent, la fonction exec_sql fonctionne correctement
-- et la migration devrait pouvoir créer les tables dans Supabase
-- ============================================================================
