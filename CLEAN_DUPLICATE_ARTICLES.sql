-- Script pour identifier et nettoyer les articles en double dans 2009_bu02

-- ÉTAPE 1: Identifier tous les articles en double
SELECT 
    "Narticle",
    COUNT(*) as nombre_occurrences,
    STRING_AGG(designation, ' | ') as designations,
    STRING_AGG("Nfournisseur", ' | ') as fournisseurs
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1
ORDER BY nombre_occurrences DESC;

-- ÉTAPE 2: Voir les détails de l'article 6786 en double
SELECT 
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
    stock_bl,
    ctid  -- Identifiant physique de la ligne
FROM "2009_bu02".article
WHERE "Narticle" = '6786'
ORDER BY ctid;

-- ÉTAPE 3: Supprimer les doublons en gardant la ligne avec le stock le plus élevé
-- ATTENTION: Cette requête va SUPPRIMER des données. Vérifiez d'abord les résultats ci-dessus !
-- Décommentez les lignes ci-dessous SEULEMENT si vous voulez supprimer les doublons

/*
DELETE FROM "2009_bu02".article
WHERE ctid IN (
    SELECT ctid
    FROM (
        SELECT 
            ctid,
            "Narticle",
            ROW_NUMBER() OVER (
                PARTITION BY "Narticle" 
                ORDER BY (stock_f + stock_bl) DESC, ctid
            ) as rn
        FROM "2009_bu02".article
    ) t
    WHERE rn > 1
);
*/

-- ÉTAPE 4: Vérifier qu'il n'y a plus de doublons après nettoyage
/*
SELECT 
    "Narticle",
    COUNT(*) as nombre_occurrences
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1;
*/

-- ÉTAPE 5: Compter le nombre total d'articles après nettoyage
/*
SELECT COUNT(*) as total_articles FROM "2009_bu02".article;
*/
