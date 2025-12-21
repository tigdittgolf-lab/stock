-- Test pour découvrir les vraies tables de votre schéma

-- Test 1: Lister TOUTES les tables dans votre schéma
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = '2025_bu01'
ORDER BY table_name;

-- Test 2: Vérifier les BL (on sait que ça existe)
SELECT 'BL Test' as test_name, COUNT(*) as count FROM "2025_bu01".bl;

-- Test 3: Voir la structure de la table BL
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' 
  AND table_name = 'bl'
ORDER BY ordinal_position;

-- Test 4: Voir quelques données BL
SELECT nfact, nclient, date_fact, montant_ht, tva 
FROM "2025_bu01".bl 
LIMIT 3;