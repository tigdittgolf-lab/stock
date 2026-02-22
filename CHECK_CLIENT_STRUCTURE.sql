-- Vérifier la structure de la table client
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'client'
ORDER BY ordinal_position;
