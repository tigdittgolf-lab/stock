-- =====================================================
-- EXECUTE THIS IN SUPABASE SQL EDITOR FIRST
-- This will create all RPC functions needed for migration
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
DROP FUNCTION IF EXISTS get_famille_art_by_tenant(TEXT);

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

-- 4. Famille Articles
CREATE OR REPLACE FUNCTION get_famille_art_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(t) FROM (SELECT * FROM %I.famille_art ORDER BY id) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- 5. Activités
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

-- 6. Bons de Livraison
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

-- 7. Factures
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

-- 8. Proformas
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

-- 9. Détails BL
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

-- 10. Détails Factures
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

-- 11. Détails Proformas
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
-- GRANT PERMISSIONS
-- =====================================================

GRANT EXECUTE ON FUNCTION get_articles_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_clients_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fournisseurs_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_famille_art_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_activites_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bls_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_factures_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_proformas_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_detail_bl_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_detail_fact_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_detail_proforma_by_tenant(TEXT) TO authenticated;

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Test functions
SELECT 'Articles:' as table_name, json_array_length(get_articles_by_tenant('2025_bu01')) as count
UNION ALL
SELECT 'Clients:', json_array_length(get_clients_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Fournisseurs:', json_array_length(get_fournisseurs_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Famille_art:', json_array_length(get_famille_art_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Activites:', json_array_length(get_activites_by_tenant('2025_bu01'))
UNION ALL
SELECT 'BLs:', json_array_length(get_bls_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Factures:', json_array_length(get_factures_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Proformas:', json_array_length(get_proformas_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Detail_BL:', json_array_length(get_detail_bl_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Detail_Fact:', json_array_length(get_detail_fact_by_tenant('2025_bu01'))
UNION ALL
SELECT 'Detail_Proforma:', json_array_length(get_detail_proforma_by_tenant('2025_bu01'));

-- SUCCESS MESSAGE
DO $$
BEGIN
  RAISE NOTICE '✅ All 11 RPC functions created successfully!';
  RAISE NOTICE '📋 Ready for complete migration with all tables';
END $$;