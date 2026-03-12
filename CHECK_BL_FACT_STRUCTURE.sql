-- Vérifier la structure complète des tables BL et FACT
SELECT 'BL columns' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'bl'
ORDER BY ordinal_position;

SELECT 'FACT columns' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fact'
ORDER BY ordinal_position;

-- Vérifier si la colonne marge existe et contient des données
SELECT 'BL avec marge' as info;
SELECT "NFact", montant_ht, "TVA", marge, marge_percent
FROM "2009_bu02".bl
WHERE marge IS NOT NULL
LIMIT 5;

SELECT 'FACT avec marge' as info;
SELECT "NFact", montant_ht, "TVA", marge, marge_percent
FROM "2009_bu02".fact
WHERE marge IS NOT NULL
LIMIT 5;
