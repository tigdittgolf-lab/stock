-- Lister toutes les versions des fonctions pour voir leurs signatures exactes
SELECT 
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'insert_fact_safe',
    'insert_detail_fact_safe',
    'update_stock_facture',
    'insert_proforma_simple',
    'insert_detail_proforma_simple'
  )
ORDER BY p.proname, arguments;
