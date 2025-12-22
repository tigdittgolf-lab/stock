-- Vérification des fonctions RPC migrées
\echo '=== VERIFICATION DES FONCTIONS RPC MIGREES ==='

\echo '=== LISTE DES FONCTIONS CREEES ==='
SELECT proname as function_name, 
       pronargs as num_args,
       prorettype::regtype as return_type,
       prosrc as source_code_preview
FROM pg_proc 
WHERE proname LIKE '%_by_tenant' 
   OR proname IN ('calculate_margin', 'get_next_number', 'update_stock')
ORDER BY proname;

\echo '=== TEST DES FONCTIONS AVEC DONNEES REELLES ==='

\echo '--- Test get_articles_by_tenant ---'
SELECT COUNT(*) as total_articles FROM get_articles_by_tenant('2025_bu01');

\echo '--- Test get_clients_by_tenant ---'
SELECT COUNT(*) as total_clients FROM get_clients_by_tenant('2025_bu01');

\echo '--- Test get_fournisseurs_by_tenant ---'
SELECT COUNT(*) as total_fournisseurs FROM get_fournisseurs_by_tenant('2025_bu01');

\echo '--- Test calculate_margin ---'
SELECT calculate_margin(1000.00, 1200.00) as marge_calculee;

\echo '--- Test get_next_number ---'
SELECT get_next_number('2025_bu01', 'bl') as prochain_numero_bl;
SELECT get_next_number('2025_bu01', 'facture') as prochain_numero_facture;

\echo '=== ECHANTILLON DE DONNEES VIA FONCTIONS RPC ==='

\echo '--- Articles via RPC ---'
SELECT narticle, designation, prix_vente 
FROM get_articles_by_tenant('2025_bu01') 
LIMIT 3;

\echo '--- Clients via RPC ---'
SELECT nclient, raison_sociale, tel 
FROM get_clients_by_tenant('2025_bu01') 
LIMIT 3;

\echo '--- Fournisseurs via RPC ---'
SELECT nfournisseur, nom_fournisseur, tel 
FROM get_fournisseurs_by_tenant('2025_bu01') 
LIMIT 2;