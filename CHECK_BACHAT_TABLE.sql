-- Vérifier la structure de la table bachat
SELECT 
  table_schema,
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'bachat'
ORDER BY ordinal_position;
