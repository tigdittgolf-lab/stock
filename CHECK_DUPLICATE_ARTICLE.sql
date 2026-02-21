-- Vérifier si l'article 6786 existe en double dans la base
SELECT 
    "Narticle",
    designation,
    "Nfournisseur",
    prix_vente,
    stock_f,
    stock_bl,
    (stock_f + stock_bl) as stock_total
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
ORDER BY "Narticle";

-- Compter combien de fois l'article 6786 apparaît
SELECT 
    "Narticle",
    COUNT(*) as nombre_occurrences
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
GROUP BY "Narticle";

-- Vérifier s'il y a d'autres articles en double
SELECT 
    "Narticle",
    COUNT(*) as nombre_occurrences
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1
ORDER BY nombre_occurrences DESC
LIMIT 20;
