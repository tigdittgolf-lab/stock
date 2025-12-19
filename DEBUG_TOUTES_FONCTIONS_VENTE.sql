-- =====================================================
-- DEBUG TOUTES LES FONCTIONS DOCUMENTS VENTE
-- =====================================================

-- 1. DEBUG BL VENTE
-- =====================================================
CREATE OR REPLACE FUNCTION get_delivery_notes(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT *
      FROM %I.bl 
      ORDER BY nfact DESC
      LIMIT 10
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'table', p_tenant || '.bl');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. DEBUG FACTURES VENTE
-- =====================================================
CREATE OR REPLACE FUNCTION get_invoices(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT *
      FROM %I.fact 
      ORDER BY nfact DESC
      LIMIT 10
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'table', p_tenant || '.fact');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. DEBUG PROFORMAS (celle-ci fonctionne déjà mais pour cohérence)
-- =====================================================
CREATE OR REPLACE FUNCTION get_proformas(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT *
      FROM %I.fprof 
      ORDER BY nfact DESC
      LIMIT 10
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'table', p_tenant || '.fprof');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTS
-- =====================================================
-- SELECT get_delivery_notes('2025_bu01');
-- SELECT get_invoices('2025_bu01');  
-- SELECT get_proformas('2025_bu01');