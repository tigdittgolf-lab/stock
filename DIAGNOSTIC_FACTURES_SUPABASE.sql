-- =====================================================
-- DIAGNOSTIC : Vérifier les données de factures
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. Vérifier si le schéma 2025_bu01 existe
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name = '2025_bu01';

-- 2. Vérifier si la table fact existe dans le schéma
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = '2025_bu01' AND table_name = 'fact';

-- 3. Vérifier le contenu de la table fact
SELECT * FROM "2025_bu01".fact ORDER BY nfact;

-- 4. Compter le nombre de factures
SELECT COUNT(*) as nombre_factures FROM "2025_bu01".fact;

-- 5. Vérifier la structure de la table fact
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = '2025_bu01' AND table_name = 'fact'
ORDER BY ordinal_position;

-- 6. Vérifier les détails des factures
SELECT * FROM "2025_bu01".detail_fact ORDER BY nfact, id;

-- 7. Test direct de la fonction avec debug
DO $$
DECLARE
    schema_exists BOOLEAN;
    table_exists BOOLEAN;
    row_count INTEGER;
BEGIN
    -- Vérifier le schéma
    SELECT EXISTS(
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = '2025_bu01'
    ) INTO schema_exists;
    
    RAISE NOTICE 'Schéma 2025_bu01 existe: %', schema_exists;
    
    -- Vérifier la table
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = '2025_bu01' AND table_name = 'fact'
    ) INTO table_exists;
    
    RAISE NOTICE 'Table fact existe: %', table_exists;
    
    -- Compter les lignes
    IF table_exists THEN
        EXECUTE 'SELECT COUNT(*) FROM "2025_bu01".fact' INTO row_count;
        RAISE NOTICE 'Nombre de factures: %', row_count;
    END IF;
END $$;