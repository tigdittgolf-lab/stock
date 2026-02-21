-- Augmenter la taille de la colonne email pour les clients
-- Actuellement VARCHAR(10), on passe à VARCHAR(100) pour les emails complets

ALTER TABLE "2009_bu02".client 
ALTER COLUMN email TYPE VARCHAR(100);

-- Vérifier le changement
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'client'
  AND column_name = 'email';

-- Faire la même chose pour les fournisseurs si nécessaire
-- La colonne EMAIL des fournisseurs est déjà VARCHAR(26), on peut l'augmenter aussi
ALTER TABLE "2009_bu02".fournisseur 
ALTER COLUMN "EMAIL" TYPE VARCHAR(100);

-- Vérifier
SELECT 
    column_name,
    data_type,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fournisseur'
  AND column_name = 'EMAIL';
