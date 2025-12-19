-- Vérifier toutes les structures des tables de documents

-- 1. BL (Bons de Livraison Vente)
SELECT 'BL Structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'bl'
ORDER BY ordinal_position;

-- 2. FACT (Factures Vente)
SELECT 'FACT Structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'fact'
ORDER BY ordinal_position;

-- 3. FPROF (Proformas)
SELECT 'FPROF Structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'fprof'
ORDER BY ordinal_position;

-- 4. BL_ACHAT (Bons de Livraison Achat)
SELECT 'BL_ACHAT Structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'bl_achat'
ORDER BY ordinal_position;

-- 5. FACTURE_ACHAT (Factures Achat)
SELECT 'FACTURE_ACHAT Structure:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'facture_achat'
ORDER BY ordinal_position;

-- 6. Compter les données dans chaque table
SELECT 'Comptage des données:' as info;
SELECT 'bl' as table_name, COUNT(*) as count FROM "2025_bu01".bl
UNION ALL
SELECT 'fact' as table_name, COUNT(*) as count FROM "2025_bu01".fact
UNION ALL
SELECT 'fprof' as table_name, COUNT(*) as count FROM "2025_bu01".fprof
UNION ALL
SELECT 'bl_achat' as table_name, COUNT(*) as count FROM "2025_bu01".bl_achat
UNION ALL
SELECT 'facture_achat' as table_name, COUNT(*) as count FROM "2025_bu01".facture_achat;