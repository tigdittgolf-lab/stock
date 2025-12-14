-- NETTOYAGE COMPLET DES FONCTIONS CLIENTS - À EXÉCUTER DANS SUPABASE
-- Copiez ce code et exécutez-le dans Supabase SQL Editor

-- 1. LISTER TOUTES LES FONCTIONS CLIENTS EXISTANTES
SELECT 
    proname as function_name,
    oidvectortypes(proargtypes) as argument_types,
    pg_get_function_identity_arguments(oid) as full_signature,
    'DROP FUNCTION ' || proname || '(' || pg_get_function_identity_arguments(oid) || ') CASCADE;' as drop_command
FROM pg_proc 
WHERE proname LIKE '%client%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- 2. SUPPRIMER TOUTES LES VARIANTES DE get_clients_by_tenant
DROP FUNCTION IF EXISTS get_clients_by_tenant(text) CASCADE;
DROP FUNCTION IF EXISTS get_clients_by_tenant(p_tenant text) CASCADE;

-- 3. SUPPRIMER TOUTES LES VARIANTES DE insert_client_to_tenant
-- (Il faut spécifier la signature complète pour éviter l'ambiguïté)
DROP FUNCTION IF EXISTS insert_client_to_tenant(text, varchar, varchar, text, varchar, varchar, varchar, varchar, varchar, decimal, decimal) CASCADE;
DROP FUNCTION IF EXISTS insert_client_to_tenant(text, varchar, varchar, varchar, varchar, varchar, varchar, varchar, varchar, decimal, decimal) CASCADE;
DROP FUNCTION IF EXISTS insert_client_to_tenant(text, text, text, text, text, text, text, text, text, numeric, numeric) CASCADE;

-- 4. SUPPRIMER TOUTES LES VARIANTES DE update_client_in_tenant
DROP FUNCTION IF EXISTS update_client_in_tenant(text, varchar, varchar, text, varchar, varchar, varchar, varchar, varchar, decimal, decimal) CASCADE;
DROP FUNCTION IF EXISTS update_client_in_tenant(text, varchar, varchar, varchar, varchar, varchar, varchar, varchar, varchar, decimal, decimal) CASCADE;

-- 5. SUPPRIMER TOUTES LES VARIANTES DE delete_client_from_tenant
DROP FUNCTION IF EXISTS delete_client_from_tenant(text, varchar) CASCADE;
DROP FUNCTION IF EXISTS delete_client_from_tenant(text, text) CASCADE;

-- 6. SUPPRIMER AVEC FORCE (si les précédentes n'ont pas marché)
DO $$
DECLARE
    func_record RECORD;
BEGIN
    -- Supprimer toutes les fonctions contenant 'client' dans le nom
    FOR func_record IN 
        SELECT proname, oid, pg_get_function_identity_arguments(oid) as args
        FROM pg_proc 
        WHERE proname LIKE '%client%' 
        AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    LOOP
        BEGIN
            EXECUTE 'DROP FUNCTION ' || func_record.proname || '(' || func_record.args || ') CASCADE';
            RAISE NOTICE 'Dropped function: %(%)', func_record.proname, func_record.args;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop function: %(%)', func_record.proname, func_record.args;
        END;
    END LOOP;
END;
$$;

-- 7. VÉRIFIER QUE TOUTES LES FONCTIONS CLIENTS SONT SUPPRIMÉES
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE '%client%' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Si cette requête retourne des résultats, il reste des fonctions à supprimer manuellement