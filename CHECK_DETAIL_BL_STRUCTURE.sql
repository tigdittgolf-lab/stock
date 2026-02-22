-- Vérifier la structure de la table detail_bl
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2009_bu02' 
  AND table_name = 'detail_bl'
ORDER BY ordinal_position;

-- Voir quelques exemples de données
SELECT * FROM "2009_bu02".detail_bl LIMIT 5;
