-- Tester la fonction get_article_by_id_from_tenant
SELECT get_article_by_id_from_tenant('2009_bu02', '03A442');

-- Vérifier que la fonction existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_article_by_id_from_tenant';
