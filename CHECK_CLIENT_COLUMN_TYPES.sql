-- Check the actual column types and lengths in the client table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'client'
ORDER BY ordinal_position;
