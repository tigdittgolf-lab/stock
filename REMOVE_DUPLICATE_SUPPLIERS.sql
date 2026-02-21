-- ATTENTION: Ce script supprime les doublons!
-- Exécute d'abord FIND_DUPLICATE_SUPPLIERS.sql pour voir ce qui sera supprimé

-- Étape 1: Créer une table temporaire avec les fournisseurs uniques
-- On garde la ligne avec le plus de données (tel1 et tel2 remplis)
CREATE TEMP TABLE unique_suppliers AS
SELECT DISTINCT ON ("Nfournisseur")
    "Nfournisseur",
    "Nom_fournisseur",
    "Resp_fournisseur",
    "Adresse_fourni",
    "Tel",
    "tel1",
    "tel2",
    "CAF",
    "CABL",
    "EMAIL",
    commentaire
FROM "2009_bu02".fournisseur
ORDER BY "Nfournisseur", 
         CASE WHEN tel1 IS NOT NULL AND tel1 != '' THEN 1 ELSE 0 END DESC,
         CASE WHEN tel2 IS NOT NULL AND tel2 != '' THEN 1 ELSE 0 END DESC;

-- Étape 2: Afficher combien de lignes seront gardées
SELECT COUNT(*) as lignes_a_garder FROM unique_suppliers;

-- Étape 3: Supprimer TOUS les fournisseurs
DELETE FROM "2009_bu02".fournisseur;

-- Étape 4: Réinsérer les fournisseurs uniques
INSERT INTO "2009_bu02".fournisseur 
SELECT * FROM unique_suppliers;

-- Étape 5: Vérifier le résultat
SELECT COUNT(*) as total_apres_nettoyage FROM "2009_bu02".fournisseur;

-- Étape 6: Vérifier qu'il n'y a plus de doublons
SELECT 
    "Nfournisseur",
    COUNT(*) as count
FROM "2009_bu02".fournisseur
GROUP BY "Nfournisseur"
HAVING COUNT(*) > 1;

DROP TABLE unique_suppliers;
