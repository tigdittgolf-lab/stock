-- =====================================================
-- DIAGNOSTIC: Check actual table structures in Supabase
-- Run this first to see what columns exist
-- =====================================================

-- Check article table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2025_bu01' 
  AND table_name = 'article'
ORDER BY ordinal_position;

-- Check client table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2025_bu01' 
  AND table_name = 'client'
ORDER BY ordinal_position;

-- Check fournisseur table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2025_bu01' 
  AND table_name = 'fournisseur'
ORDER BY ordinal_position;

-- Check activite table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2025_bu01' 
  AND table_name = 'activite'
ORDER BY ordinal_position;

-- Check bl table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2025_bu01' 
  AND table_name = 'bl'
ORDER BY ordinal_position;

-- Check facture table structure
SELECT column_name, data_type, character_maximum_length
FROM information_schema.columns
WHERE table_schema = '2025_bu01' 
  AND table_name = 'facture'
ORDER BY ordinal_position;

-- Quick sample to see actual data
SELECT * FROM "2025_bu01".article LIMIT 1;