-- TEST DE LA FONCTION get_bl_list_by_tenant
-- Ce script permet de diagnostiquer pourquoi les BL ne s'affichent pas

-- ÉTAPE 1: Vérifier que la table bl existe et contient des données
SELECT 
    'Table bl - Nombre de lignes' as test,
    COUNT(*) as count
FROM "2009_bu02".bl;

-- ÉTAPE 2: Voir quelques exemples de BL
SELECT 
    'Exemples de BL' as test,
    *
FROM "2009_bu02".bl
LIMIT 5;

-- ÉTAPE 3: Vérifier les noms de colonnes de la table bl
SELECT 
    'Colonnes de la table bl' as test,
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = '2009_bu02' 
  AND table_name = 'bl'
ORDER BY ordinal_position;

-- ÉTAPE 4: Tester la fonction RPC directement
SELECT 
    'Test de get_bl_list_by_tenant' as test,
    get_bl_list_by_tenant('2009_bu02') as result;

-- ÉTAPE 5: Vérifier le type de retour de la fonction
SELECT 
    'Type de retour de la fonction' as test,
    pg_get_function_result(oid) as return_type
FROM pg_proc 
WHERE proname = 'get_bl_list_by_tenant';

-- ÉTAPE 6: Si la fonction retourne JSON, vérifier la structure
SELECT 
    'Structure JSON retournée' as test,
    json_typeof(get_bl_list_by_tenant('2009_bu02')) as json_type,
    json_array_length(get_bl_list_by_tenant('2009_bu02')) as array_length;
