-- =====================================================
-- RPC FUNCTIONS REQUIRED FOR REAL DATA MIGRATION
-- SIMPLIFIED VERSION - Uses RECORD type to match any table structure
-- Execute this in Supabase SQL Editor
-- =====================================================

-- DROP EXISTING FUNCTIONS FIRST (to avoid return type conflicts)
DROP FUNCTION IF EXISTS get_articles_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_clients_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_fournisseurs_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_activites_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_bls_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_factures_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_proformas_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_detail_bl_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_detail_fact_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_detail_proforma_by_tenant(TEXT);

-- =====================================================
-- CREATE FLEXIBLE FUNCTIONS THAT MATCH ACTUAL TABLE STRUCTURE
-- =====================================================

-- 1. Articles - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.article ORDER BY narticle', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 2. Clients - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.client ORDER BY nclient', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 3. Fournisseurs - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.fournisseur ORDER BY nfournisseur', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 4. Activités - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_activites_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.activite ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 5. Bons de Livraison - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_bls_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.bl ORDER BY nfact', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 6. Factures - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_factures_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.facture ORDER BY nfact', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 7. Proformas - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_proformas_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.proforma ORDER BY nfact', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 8. Détails BL - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_detail_bl_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.detail_bl ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 9. Détails Factures - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_detail_fact_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.detail_fact ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- 10. Détails Proformas - Returns all columns as they exist
CREATE OR REPLACE FUNCTION get_detail_proforma_by_tenant(p_tenant TEXT)
RETURNS SETOF RECORD
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.detail_proforma ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- Test these after creating the functions
-- Note: RECORD functions require column definitions when called
-- =====================================================

-- Test 1: Check if functions were created
SELECT proname FROM pg_proc WHERE proname LIKE '%_by_tenant';

-- Test 2: Direct table access (to verify data exists)
SELECT COUNT(*) as article_count FROM "2025_bu01".article;
SELECT COUNT(*) as client_count FROM "2025_bu01".client;

-- Test 3: Sample RPC call with column definition (example)
-- SELECT * FROM get_articles_by_tenant('2025_bu01') AS t(narticle text, designation text, famille text) LIMIT 1;

-- =====================================================
-- GRANT PERMISSIONS (if needed)
-- =====================================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_articles_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clients_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fournisseurs_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activites_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bls_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_factures_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_proformas_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_detail_bl_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_detail_fact_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_detail_proforma_by_tenant(TEXT) TO authenticated;

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ All RPC functions created successfully!';
  RAISE NOTICE '📋 Functions created: 10';
  RAISE NOTICE '🔧 Next step: Test migration at http://localhost:3000/admin/database-migration';
END $$;