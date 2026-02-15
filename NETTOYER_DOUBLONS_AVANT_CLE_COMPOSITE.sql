-- =====================================================
-- NETTOYER LES DOUBLONS AVANT D'AJOUTER LA CLÉ COMPOSITE
-- =====================================================

-- Remplacez par le nom de votre base de données
USE stock_management;

-- ===== ÉTAPE 1 : IDENTIFIER LES DOUBLONS =====

-- Doublons dans bachat
SELECT 
    nfact, 
    nfournisseur, 
    COUNT(*) as nb_doublons,
    GROUP_CONCAT(date_fact) as dates
FROM bachat
GROUP BY nfact, nfournisseur
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;

-- Doublons dans fachat
SELECT 
    nfact, 
    nfournisseur, 
    COUNT(*) as nb_doublons,
    GROUP_CONCAT(date_fact) as dates
FROM fachat
GROUP BY nfact, nfournisseur
HAVING COUNT(*) > 1
ORDER BY nb_doublons DESC;


-- ===== ÉTAPE 2 : SAUVEGARDER LES DOUBLONS =====

-- Créer une table de sauvegarde pour bachat
CREATE TABLE IF NOT EXISTS bachat_doublons_backup AS
SELECT b1.*
FROM bachat b1
INNER JOIN (
    SELECT nfact, nfournisseur, COUNT(*) as cnt
    FROM bachat
    GROUP BY nfact, nfournisseur
    HAVING cnt > 1
) b2 ON b1.nfact = b2.nfact AND b1.nfournisseur = b2.nfournisseur;

-- Créer une table de sauvegarde pour fachat
CREATE TABLE IF NOT EXISTS fachat_doublons_backup AS
SELECT f1.*
FROM fachat f1
INNER JOIN (
    SELECT nfact, nfournisseur, COUNT(*) as cnt
    FROM fachat
    GROUP BY nfact, nfournisseur
    HAVING cnt > 1
) f2 ON f1.nfact = f2.nfact AND f1.nfournisseur = f2.nfournisseur;

SELECT 'Doublons sauvegardés dans bachat_doublons_backup et fachat_doublons_backup' as message;


-- ===== ÉTAPE 3 : SUPPRIMER LES DOUBLONS (GARDER UN SEUL) =====

-- ATTENTION : Cette méthode garde UN SEUL enregistrement par combinaison (nfact, nfournisseur)
-- Si plusieurs enregistrements ont la même date max, un seul sera conservé de manière arbitraire

-- Pour bachat : Supprimer les doublons en utilisant une sous-requête
DELETE FROM bachat
WHERE (nfact, nfournisseur, date_fact, montant_ht) NOT IN (
    SELECT * FROM (
        SELECT nfact, nfournisseur, MAX(date_fact) as date_fact, MAX(montant_ht) as montant_ht
        FROM bachat
        GROUP BY nfact, nfournisseur
    ) AS temp
);

-- Si des doublons persistent (même date et même montant), supprimer en gardant un seul
DELETE b1 FROM bachat b1
INNER JOIN bachat b2 
WHERE b1.nfact = b2.nfact 
  AND b1.nfournisseur = b2.nfournisseur
  AND (b1.date_fact < b2.date_fact 
       OR (b1.date_fact = b2.date_fact AND b1.montant_ht < b2.montant_ht)
       OR (b1.date_fact = b2.date_fact AND b1.montant_ht = b2.montant_ht AND b1.ncheque < b2.ncheque));


-- Pour fachat : Supprimer les doublons en utilisant une sous-requête
DELETE FROM fachat
WHERE (nfact, nfournisseur, date_fact, montant_ht) NOT IN (
    SELECT * FROM (
        SELECT nfact, nfournisseur, MAX(date_fact) as date_fact, MAX(montant_ht) as montant_ht
        FROM fachat
        GROUP BY nfact, nfournisseur
    ) AS temp
);

-- Si des doublons persistent (même date et même montant), supprimer en gardant un seul
DELETE f1 FROM fachat f1
INNER JOIN fachat f2 
WHERE f1.nfact = f2.nfact 
  AND f1.nfournisseur = f2.nfournisseur
  AND (f1.date_fact < f2.date_fact 
       OR (f1.date_fact = f2.date_fact AND f1.montant_ht < f2.montant_ht)
       OR (f1.date_fact = f2.date_fact AND f1.montant_ht = f2.montant_ht AND f1.ncheque < f2.ncheque));


-- ===== ÉTAPE 4 : VÉRIFIER QU'IL N'Y A PLUS DE DOUBLONS =====

SELECT 'Vérification des doublons restants dans bachat:' as message;
SELECT 
    nfact, 
    nfournisseur, 
    COUNT(*) as nb_doublons
FROM bachat
GROUP BY nfact, nfournisseur
HAVING COUNT(*) > 1;

SELECT 'Vérification des doublons restants dans fachat:' as message;
SELECT 
    nfact, 
    nfournisseur, 
    COUNT(*) as nb_doublons
FROM fachat
GROUP BY nfact, nfournisseur
HAVING COUNT(*) > 1;


-- ===== ÉTAPE 5 : NETTOYER LES DÉTAILS ORPHELINS =====

-- Supprimer les détails de bachat qui n'ont plus de parent
DELETE FROM bachat_detail
WHERE NOT EXISTS (
    SELECT 1 FROM bachat 
    WHERE bachat.nfact = bachat_detail.NFact 
    AND bachat.nfournisseur = bachat_detail.nfournisseur
);

-- Supprimer les détails de fachat qui n'ont plus de parent
DELETE FROM fachat_detail
WHERE NOT EXISTS (
    SELECT 1 FROM fachat 
    WHERE fachat.nfact = fachat_detail.NFact 
    AND fachat.nfournisseur = fachat_detail.nfournisseur
);


-- ===== RÉSUMÉ =====

SELECT 
    'bachat' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT(nfact, '-', nfournisseur)) as unique_keys
FROM bachat
UNION ALL
SELECT 
    'fachat' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT(nfact, '-', nfournisseur)) as unique_keys
FROM fachat;

SELECT 'Nettoyage terminé ! Vous pouvez maintenant exécuter AJOUTER_CLE_PRIMAIRE_COMPOSITE.sql' as message;
