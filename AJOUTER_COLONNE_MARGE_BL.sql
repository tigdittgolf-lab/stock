-- =====================================================
-- AJOUTER LA COLONNE MARGE À LA TABLE BL
-- =====================================================

-- 1. Ajouter la colonne marge à la table bl
ALTER TABLE "2025_bu01".bl 
ADD COLUMN marge NUMERIC DEFAULT 0;

-- 2. Mettre à jour les enregistrements existants avec une marge par défaut
-- (vous pouvez ajuster la valeur selon vos besoins)
UPDATE "2025_bu01".bl 
SET marge = 0 
WHERE marge IS NULL;

-- 3. Vérifier que la colonne a été ajoutée
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'bl'
ORDER BY ordinal_position;

-- 4. Voir les données avec la nouvelle colonne
SELECT * FROM "2025_bu01".bl LIMIT 3;