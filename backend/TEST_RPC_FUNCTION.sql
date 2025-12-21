-- Test si la fonction RPC get_bl_list_by_tenant existe et fonctionne

-- Test 1: Vérifier si la fonction existe
SELECT proname, proargnames 
FROM pg_proc 
WHERE proname = 'get_bl_list_by_tenant';

-- Test 2: Tester la fonction RPC directement
SELECT * FROM get_bl_list_by_tenant('2025_bu01');