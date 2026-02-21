-- Script pour supprimer TOUS les articles en double dans 2009_bu02
-- Garde la version avec le stock le plus élevé (stock_f + stock_bl)

-- ÉTAPE 1: Voir combien d'articles seront supprimés
SELECT 
    COUNT(*) as articles_a_supprimer
FROM (
    SELECT 
        ctid,
        "Narticle",
        ROW_NUMBER() OVER (
            PARTITION BY "Narticle" 
            ORDER BY (stock_f + stock_bl) DESC, prix_vente DESC, ctid
        ) as rn
    FROM "2009_bu02".article
) t
WHERE rn > 1;

-- ÉTAPE 2: Voir les détails des articles qui seront supprimés
SELECT 
    t."Narticle",
    t.designation,
    t."Nfournisseur",
    t.stock_f,
    t.stock_bl,
    (t.stock_f + t.stock_bl) as stock_total,
    t.prix_vente,
    'SERA SUPPRIMÉ' as action
FROM "2009_bu02".article t
INNER JOIN (
    SELECT 
        ctid
    FROM (
        SELECT 
            ctid,
            "Narticle",
            ROW_NUMBER() OVER (
                PARTITION BY "Narticle" 
                ORDER BY (stock_f + stock_bl) DESC, prix_vente DESC, ctid
            ) as rn
        FROM "2009_bu02".article
    ) sub
    WHERE rn > 1
) to_delete ON t.ctid = to_delete.ctid
ORDER BY t."Narticle";

-- ÉTAPE 3: SUPPRIMER les doublons (décommentez pour exécuter)
-- ⚠️ ATTENTION: Cette action est IRRÉVERSIBLE !
-- Vérifiez d'abord les résultats des étapes 1 et 2 ci-dessus

DELETE FROM "2009_bu02".article
WHERE ctid IN (
    SELECT ctid
    FROM (
        SELECT 
            ctid,
            "Narticle",
            ROW_NUMBER() OVER (
                PARTITION BY "Narticle" 
                ORDER BY (stock_f + stock_bl) DESC, prix_vente DESC, ctid
            ) as rn
        FROM "2009_bu02".article
    ) t
    WHERE rn > 1
);

-- ÉTAPE 4: Vérifier qu'il n'y a plus de doublons
SELECT 
    "Narticle",
    COUNT(*) as nombre_occurrences
FROM "2009_bu02".article
GROUP BY "Narticle"
HAVING COUNT(*) > 1;

-- ÉTAPE 5: Compter le nombre total d'articles après nettoyage
SELECT 
    COUNT(*) as total_articles_uniques,
    (SELECT COUNT(*) FROM "2009_bu02".article) as total_lignes
FROM (
    SELECT DISTINCT "Narticle" FROM "2009_bu02".article
) distinct_articles;

-- ÉTAPE 6: Afficher un résumé
SELECT 
    'Nettoyage terminé' as statut,
    COUNT(DISTINCT "Narticle") as articles_uniques,
    COUNT(*) as total_lignes
FROM "2009_bu02".article;
