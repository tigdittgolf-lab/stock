-- Vérifier si l'article 6786 existe toujours en double
SELECT 
    "Narticle",
    designation,
    "Nfournisseur",
    prix_vente,
    stock_f,
    stock_bl,
    (stock_f + stock_bl) as stock_total,
    ctid
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
ORDER BY ctid;

-- Vérifier le ROW_NUMBER pour comprendre pourquoi il n'a pas été supprimé
SELECT 
    "Narticle",
    designation,
    "Nfournisseur",
    prix_vente,
    stock_f,
    stock_bl,
    (stock_f + stock_bl) as stock_total,
    ctid,
    ROW_NUMBER() OVER (
        PARTITION BY "Narticle" 
        ORDER BY (stock_f + stock_bl) DESC, prix_vente DESC, ctid
    ) as row_num
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
ORDER BY row_num;

-- Supprimer MANUELLEMENT le doublon de l'article 6786
-- On garde celui avec le stock le plus élevé (552)
DELETE FROM "2009_bu02".article
WHERE "Narticle" = '6786'
  AND (stock_f + stock_bl) = 0;  -- Supprimer celui avec stock = 0

-- Vérifier qu'il ne reste qu'une seule ligne
SELECT 
    "Narticle",
    designation,
    "Nfournisseur",
    prix_vente,
    stock_f,
    stock_bl,
    (stock_f + stock_bl) as stock_total
FROM "2009_bu02".article
WHERE "Narticle" = '6786';

-- Vérifier s'il reste d'autres doublons
SELECT 
    "Narticle",
    COUNT(*) as nombre_occurrences
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1
ORDER BY "Narticle";
