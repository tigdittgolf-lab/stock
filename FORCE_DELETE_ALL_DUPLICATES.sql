-- Script FORCE pour supprimer TOUS les doublons restants
-- Utilise une approche différente avec une table temporaire

-- Étape 1: Créer une table temporaire avec les articles à GARDER
CREATE TEMP TABLE articles_to_keep AS
SELECT DISTINCT ON ("Narticle")
    "Narticle",
    famille,
    designation,
    "Nfournisseur",
    prix_unitaire,
    marge,
    tva,
    prix_vente,
    seuil,
    stock_f,
    stock_bl
FROM "2009_bu02".article
ORDER BY 
    "Narticle",
    (stock_f + stock_bl) DESC,  -- Garder celui avec le plus de stock
    prix_vente DESC,             -- En cas d'égalité, garder le plus cher
    ctid;                        -- En dernier recours, garder le premier

-- Étape 2: Voir combien d'articles uniques on va garder
SELECT COUNT(*) as articles_uniques_a_garder FROM articles_to_keep;

-- Étape 3: Supprimer TOUS les articles de la table originale
DELETE FROM "2009_bu02".article;

-- Étape 4: Réinsérer uniquement les articles uniques
INSERT INTO "2009_bu02".article (
    "Narticle",
    famille,
    designation,
    "Nfournisseur",
    prix_unitaire,
    marge,
    tva,
    prix_vente,
    seuil,
    stock_f,
    stock_bl
)
SELECT 
    "Narticle",
    famille,
    designation,
    "Nfournisseur",
    prix_unitaire,
    marge,
    tva,
    prix_vente,
    seuil,
    stock_f,
    stock_bl
FROM articles_to_keep;

-- Étape 5: Vérifier qu'il n'y a plus de doublons
SELECT 
    "Narticle",
    COUNT(*) as nombre_occurrences
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1;

-- Étape 6: Afficher le résumé final
SELECT 
    COUNT(*) as total_articles,
    COUNT(DISTINCT "Narticle") as articles_uniques,
    (COUNT(*) - COUNT(DISTINCT "Narticle")) as doublons_restants
FROM "2009_bu02".article;

-- Étape 7: Vérifier l'article 6786 spécifiquement
SELECT 
    "Narticle",
    designation,
    "Nfournisseur",
    prix_vente,
    (stock_f + stock_bl) as stock_total
FROM "2009_bu02".article
WHERE "Narticle" = '6786';
