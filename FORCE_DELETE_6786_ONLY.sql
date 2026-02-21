-- Supprimer UNIQUEMENT les doublons de l'article 6786
-- Garde la version avec le stock le plus élevé

-- Voir les versions actuelles
SELECT 
    "Narticle",
    designation,
    "Nfournisseur",
    stock_f,
    stock_bl,
    (stock_f + stock_bl) as stock_total,
    prix_vente,
    ctid
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
ORDER BY (stock_f + stock_bl) DESC;

-- Supprimer toutes les versions SAUF celle avec le plus de stock
DELETE FROM "2009_bu02".article
WHERE "Narticle" = '6786'
  AND ctid NOT IN (
    SELECT ctid
    FROM "2009_bu02".article
    WHERE "Narticle" = '6786'
    ORDER BY (stock_f + stock_bl) DESC, prix_vente DESC, ctid
    LIMIT 1
  );

-- Vérifier qu'il ne reste qu'une seule ligne
SELECT 
    COUNT(*) as nombre_lignes_restantes,
    "Narticle",
    designation,
    "Nfournisseur",
    (stock_f + stock_bl) as stock_total
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
GROUP BY "Narticle", designation, "Nfournisseur", stock_f, stock_bl;
