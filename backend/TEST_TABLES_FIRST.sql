-- Test simple pour vérifier les tables et créer une fonction basique

-- D'abord, testons si les tables existent
-- Remplacez '2025_bu01' par votre vrai schéma si différent

-- Test 1: Vérifier les BL
SELECT 'BL Test' as test_name, COUNT(*) as count FROM "2025_bu01".bl;

-- Test 2: Vérifier les factures  
SELECT 'Factures Test' as test_name, COUNT(*) as count FROM "2025_bu01".factures;

-- Test 3: Vérifier les colonnes des BL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' 
  AND table_name = 'bl'
ORDER BY ordinal_position;

-- Test 4: Vérifier les colonnes des factures
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' 
  AND table_name = 'factures'
ORDER BY ordinal_position;