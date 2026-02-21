-- ÉTAPE 1: Compter combien de fois l'article 6786 existe
SELECT COUNT(*) as nombre_lignes_6786 
FROM "2009_bu02".article 
WHERE "Narticle" = '6786';

-- ÉTAPE 2: Voir TOUTES les versions avec leurs détails
SELECT 
    "Narticle",
    designation,
    "Nfournisseur",
    stock_f,
    stock_bl,
    (stock_f + stock_bl) as stock_total,
    prix_vente,
    ctid as identifiant_physique
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
ORDER BY ctid;

-- ÉTAPE 3: Supprimer TOUTES les lignes de l'article 6786
DELETE FROM "2009_bu02".article WHERE "Narticle" = '6786';

-- ÉTAPE 4: Réinsérer UNE SEULE version (celle avec SAADA et stock de 5)
INSERT INTO "2009_bu02".article (
    "Narticle",
    designation,
    famille,
    "Nfournisseur",
    prix_unitaire,
    marge,
    tva,
    prix_vente,
    seuil,
    stock_f,
    stock_bl
) VALUES (
    '6786',
    'PLIEUSE DE TOLE 1.05M KING',
    'Outillage',
    ' SAADA',
    200.00,
    126.05,
    40.00,
    333410.00,
    0,
    0,
    5
);

-- ÉTAPE 5: Vérifier qu'il n'y a plus qu'UNE SEULE ligne
SELECT 
    COUNT(*) as verification_nombre_lignes,
    "Narticle",
    designation,
    "Nfournisseur",
    (stock_f + stock_bl) as stock_total
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
GROUP BY "Narticle", designation, "Nfournisseur", stock_f, stock_bl;

-- ÉTAPE 6: Vérifier le nombre total d'articles
SELECT COUNT(*) as total_articles FROM "2009_bu02".article;
