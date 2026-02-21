-- Tester la fonction RPC get_articles_by_tenant pour voir ce qu'elle retourne
SELECT get_articles_by_tenant('2009_bu02');

-- Extraire et compter les articles retournés par la fonction
SELECT 
    json_array_length(get_articles_by_tenant('2009_bu02')) as nombre_articles_retournes;

-- Filtrer uniquement l'article 6786 dans le résultat JSON
SELECT 
    elem->>'narticle' as code_article,
    elem->>'designation' as designation,
    elem->>'nfournisseur' as fournisseur,
    elem->>'prix_vente' as prix_vente,
    elem->>'stock_f' as stock_f,
    elem->>'stock_bl' as stock_bl
FROM json_array_elements(get_articles_by_tenant('2009_bu02')) as elem
WHERE elem->>'narticle' = '6786';

-- Compter combien de fois l'article 6786 apparaît dans le résultat RPC
SELECT 
    COUNT(*) as occurrences_article_6786
FROM json_array_elements(get_articles_by_tenant('2009_bu02')) as elem
WHERE elem->>'narticle' = '6786';
