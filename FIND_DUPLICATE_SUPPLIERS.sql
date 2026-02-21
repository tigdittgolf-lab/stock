-- Trouver tous les fournisseurs en double
SELECT 
    "Nfournisseur",
    COUNT(*) as count,
    STRING_AGG("Nom_fournisseur", ', ') as noms
FROM "2009_bu02".fournisseur
GROUP BY "Nfournisseur"
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC, "Nfournisseur";

-- Compter le nombre total de doublons
SELECT 
    COUNT(DISTINCT "Nfournisseur") as unique_suppliers,
    COUNT(*) as total_rows,
    COUNT(*) - COUNT(DISTINCT "Nfournisseur") as duplicates
FROM "2009_bu02".fournisseur;

-- Voir tous les enregistrements du fournisseur 12 avec leurs différences
SELECT 
    "Nfournisseur",
    "Nom_fournisseur",
    "Resp_fournisseur",
    "Tel",
    "tel1",
    "tel2",
    "EMAIL",
    "CAF",
    "CABL"
FROM "2009_bu02".fournisseur
WHERE "Nfournisseur" = '12';
