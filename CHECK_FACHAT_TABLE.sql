-- Check if fachat table exists and its structure
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = '2009_bu02' 
  AND table_name IN ('fachat', 'facture_achat')
ORDER BY table_name, ordinal_position;

-- Also check what tables exist in the schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '2009_bu02' 
  AND table_name LIKE '%achat%'
ORDER BY table_name;
