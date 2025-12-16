-- =====================================================
-- ADD SUPPLIER INVOICE NUMBER COLUMN TO EXISTING TABLES
-- Execute this in Supabase SQL Editor
-- =====================================================

-- Add the numero_facture_fournisseur column to existing facture_achat tables
-- This will work for all tenant schemas

DO $$
DECLARE
    schema_name TEXT;
    table_exists BOOLEAN;
BEGIN
    -- Loop through all schemas that match the tenant pattern (YYYY_buXX)
    FOR schema_name IN 
        SELECT nspname 
        FROM pg_namespace 
        WHERE nspname ~ '^[0-9]{4}_bu[0-9]{2}$'
    LOOP
        -- Check if facture_achat table exists in this schema
        SELECT EXISTS(
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = schema_name AND table_name = 'facture_achat'
        ) INTO table_exists;
        
        IF table_exists THEN
            -- Check if column already exists
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = schema_name 
                AND table_name = 'facture_achat' 
                AND column_name = 'numero_facture_fournisseur'
            ) THEN
                -- Add the column
                EXECUTE format('ALTER TABLE %I.facture_achat ADD COLUMN numero_facture_fournisseur VARCHAR(100)', schema_name);
                RAISE NOTICE 'Added numero_facture_fournisseur column to %.facture_achat', schema_name;
            ELSE
                RAISE NOTICE 'Column numero_facture_fournisseur already exists in %.facture_achat', schema_name;
            END IF;
        ELSE
            RAISE NOTICE 'Table facture_achat does not exist in schema %', schema_name;
        END IF;
    END LOOP;
END $$;

-- Also ensure the column exists for future tenant schemas by updating the ensure_purchase_schema function
-- (This was already done in the previous RPC functions script)

-- Test the column addition
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'facture_achat' 
AND column_name = 'numero_facture_fournisseur'
ORDER BY table_schema;