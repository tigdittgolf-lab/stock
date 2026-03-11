-- Vérifier la structure de la table bl dans le schéma 2009_bu02
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'bl'
ORDER BY ordinal_position;
