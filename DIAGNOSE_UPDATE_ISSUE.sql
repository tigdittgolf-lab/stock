-- Diagnostic: Check what values are being sent and which column is VARCHAR(10)

-- 1. Check all column types in client table
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'client'
ORDER BY ordinal_position;

-- 2. Check a sample client record to see actual data
SELECT * FROM "2009_bu02".client LIMIT 1;

-- 3. Find columns with VARCHAR(10) specifically
SELECT 
    column_name,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'client'
  AND character_maximum_length = 10;
