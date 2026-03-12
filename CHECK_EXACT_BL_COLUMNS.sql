-- Vérifier les colonnes exactes de la table BL
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'bl'
  AND column_name LIKE '%marge%'
ORDER BY ordinal_position;

-- Vérifier aussi pour FACT
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fact'
  AND column_name LIKE '%marge%'
ORDER BY ordinal_position;

-- Voir un exemple de BL avec toutes ses colonnes
SELECT *
FROM "2009_bu02".bl
LIMIT 1;
