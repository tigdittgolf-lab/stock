-- =====================================================
-- RPC FUNCTIONS FOR MIGRATION - JSON RETURN TYPE
-- This approach is more flexible and works with any table structure
-- Execute this in Supabase SQL Editor
-- =====================================================

-- DROP EXISTING FUNCTIONS FIRST
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
-- CREATE FUNCTIONS THAT RETURN JSON
-- =====================================================

-- 1. Articles
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.article ORDER BY narticle) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 2. Clients
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.client ORDER BY nclient) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 3. Fournisseurs
CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.fournisseur ORDER BY nfournisseur) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 4. Activités
CREATE OR REPLACE FUNCTION get_activites_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.activite ORDER BY id) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 5. Bons de Livraison
CREATE OR REPLACE FUNCTION get_bls_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.bl ORDER BY nfact) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 6. Factures
CREATE OR REPLACE FUNCTION get_factures_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.facture ORDER BY nfact) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 7. Proformas
CREATE OR REPLACE FUNCTION get_proformas_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.proforma ORDER BY nfact) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 8. Détails BL
CREATE OR REPLACE FUNCTION get_detail_bl_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.detail_bl ORDER BY id) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 9. Détails Factures
CREATE OR REPLACE FUNCTION get_detail_fact_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.detail_fact ORDER BY id) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 10. Détails Proformas
CREATE OR REPLACE FUNCTION get_detail_proforma_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.detail_proforma ORDER BY id) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Test 1: Check if functions were created
SELECT proname FROM pg_proc WHERE proname LIKE '%_by_tenant';

-- Test 2: Test a function (returns JSON)
SELECT get_articles_by_tenant('2025_bu01');

-- Test 3: Count records in JSON result
SELECT json_array_length(get_articles_by_tenant('2025_bu01')) as article_count;
SELECT json_array_length(get_clients_by_tenant('2025_bu01')) as client_count;

-- =====================================================
-- GRANT PERMISSIONS
-- =====================================================

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
  RAISE NOTICE '✅ All RPC functions created successfully with JSON return type!';
  RAISE NOTICE '📋 Functions created: 10';
  RAISE NOTICE '🔧 These functions return JSON arrays that match your exact table structure';
  RAISE NOTICE '🔧 Next step: Test migration at http://localhost:3000/admin/database-migration';
END $$;
