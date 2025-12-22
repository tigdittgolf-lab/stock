-- =====================================================
-- ANALYSE COMPLÈTE DE LA STRUCTURE SOURCE (SUPABASE)
-- Exécutez ceci dans Supabase SQL Editor pour voir la vraie structure
-- =====================================================

-- 1. LISTER TOUS LES SCHÉMAS TENANT
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name LIKE '%_bu%' 
ORDER BY schema_name;

-- 2. LISTER TOUTES LES TABLES DANS UN SCHÉMA TENANT (exemple: 2025_bu01)
SELECT table_name, table_type
FROM information_schema.tables 
WHERE table_schema = '2025_bu01' 
ORDER BY table_name;

-- 3. STRUCTURE COMPLÈTE DE CHAQUE TABLE
-- Articles
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'article'
ORDER BY ordinal_position;

-- Clients  
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'client'
ORDER BY ordinal_position;

-- Fournisseurs
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'fournisseur'
ORDER BY ordinal_position;

-- Activité
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'activite'
ORDER BY ordinal_position;

-- BL
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'bl'
ORDER BY ordinal_position;

-- Facture
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'facture'
ORDER BY ordinal_position;

-- Proforma
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'proforma'
ORDER BY ordinal_position;

-- Detail BL
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'detail_bl'
ORDER BY ordinal_position;

-- Detail Facture
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'detail_fact'
ORDER BY ordinal_position;

-- Detail Proforma
SELECT column_name, data_type, character_maximum_length, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = '2025_bu01' AND table_name = 'detail_proforma'
ORDER BY ordinal_position;

-- 4. LISTER TOUTES LES AUTRES TABLES (au cas où il y en a plus)
SELECT table_name, 
       (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema = '2025_bu01' AND table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = '2025_bu01' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 5. CONTRAINTES ET INDEX
SELECT 
    tc.constraint_name,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = '2025_bu01'
ORDER BY tc.table_name, tc.constraint_type;

-- 6. COMPTER LES ENREGISTREMENTS DANS CHAQUE TABLE
DO $$
DECLARE
    table_record RECORD;
    sql_query TEXT;
    row_count INTEGER;
BEGIN
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = '2025_bu01' 
          AND table_type = 'BASE TABLE'
    LOOP
        sql_query := format('SELECT COUNT(*) FROM "2025_bu01".%I', table_record.table_name);
        EXECUTE sql_query INTO row_count;
        RAISE NOTICE 'Table %: % enregistrements', table_record.table_name, row_count;
    END LOOP;
END $$;

-- 7. ÉCHANTILLON DE DONNÉES POUR COMPRENDRE LA STRUCTURE
SELECT 'ARTICLE SAMPLE:' as info;
SELECT * FROM "2025_bu01".article LIMIT 2;

SELECT 'CLIENT SAMPLE:' as info;
SELECT * FROM "2025_bu01".client LIMIT 2;

SELECT 'FOURNISSEUR SAMPLE:' as info;
SELECT * FROM "2025_bu01".fournisseur LIMIT 2;