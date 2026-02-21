-- Check the actual column types and lengths in the fournisseur table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fournisseur'
ORDER BY ordinal_position;

-- Find columns with small VARCHAR limits
SELECT 
    column_name,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fournisseur'
  AND character_maximum_length <= 20;
