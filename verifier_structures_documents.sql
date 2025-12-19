-- Vérifier la structure des tables de documents

-- 1. Table BL (Bons de Livraison)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'bl'
ORDER BY ordinal_position;

-- 2. Table FACT (Factures) 
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'fact'
ORDER BY ordinal_position;

-- 3. Table FPROF (Proformas)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'fprof'
ORDER BY ordinal_position;

-- 4. Table FACHAT (Factures Achat)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'fachat'
ORDER BY ordinal_position;