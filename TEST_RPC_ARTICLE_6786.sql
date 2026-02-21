-- Tester directement ce que la fonction RPC retourne pour l'article 6786
SELECT 
    elem->>'narticle' as code_article,
    elem->>'designation' as designation,
    elem->>'nfournisseur' as fournisseur,
    elem->>'prix_vente' as prix_vente,
    (elem->>'stock_f')::int as stock_f,
    (elem->>'stock_bl')::int as stock_bl,
    ((elem->>'stock_f')::int + (elem->>'stock_bl')::int) as stock_total
FROM json_array_elements(get_articles_by_tenant('2009_bu02')) as elem
WHERE elem->>'narticle' = '6786';

-- Compter combien de fois l'article 6786 apparaît dans le résultat RPC
SELECT 
    COUNT(*) as occurrences_dans_rpc
FROM json_array_elements(get_articles_by_tenant('2009_bu02')) as elem
WHERE elem->>'narticle' = '6786';
