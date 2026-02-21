-- Vérifier si le fournisseur 12 existe dans Supabase
SELECT * FROM "2009_bu02".fournisseur WHERE "Nfournisseur" = '12';

-- Vérifier tous les fournisseurs qui commencent par '1'
SELECT "Nfournisseur", "Nom_fournisseur", "Resp_fournisseur" 
FROM "2009_bu02".fournisseur 
WHERE "Nfournisseur" LIKE '1%'
ORDER BY "Nfournisseur";

-- Compter le nombre total de fournisseurs
SELECT COUNT(*) as total FROM "2009_bu02".fournisseur;
