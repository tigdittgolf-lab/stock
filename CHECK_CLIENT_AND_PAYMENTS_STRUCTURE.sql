-- Vérifier la structure complète de la table client dans le schéma 2009_bu02
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'client'
ORDER BY ordinal_position;

-- Vérifier la structure de la table payments dans le schéma public
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'payments'
ORDER BY ordinal_position;
