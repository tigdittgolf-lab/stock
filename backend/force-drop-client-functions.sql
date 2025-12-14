-- SUPPRESSION FORCÉE DES FONCTIONS CLIENTS - À EXÉCUTER DANS SUPABASE
-- Copiez ce code et exécutez-le dans Supabase SQL Editor

-- 1. Lister toutes les fonctions clients existantes pour voir leurs signatures
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname LIKE '%client%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Supprimer toutes les variantes possibles de get_clients_by_tenant
DROP FUNCTION IF EXISTS get_clients_by_tenant(text) CASCADE;
DROP FUNCTION IF EXISTS public.get_clients_by_tenant(text) CASCADE;

-- Essayer avec différentes signatures possibles
DROP FUNCTION IF EXISTS get_clients_by_tenant(p_tenant text) CASCADE;
DROP FUNCTION IF EXISTS get_clients_by_tenant(text, text) CASCADE;
DROP FUNCTION IF EXISTS get_clients_by_tenant(text, varchar) CASCADE;

-- 3. Supprimer les autres fonctions clients si elles existent
DROP FUNCTION IF EXISTS insert_client_to_tenant CASCADE;
DROP FUNCTION IF EXISTS update_client_in_tenant CASCADE;
DROP FUNCTION IF EXISTS delete_client_from_tenant CASCADE;

-- 4. Vérifier qu'elles sont supprimées
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE '%client%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');