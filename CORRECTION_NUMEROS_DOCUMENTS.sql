-- =====================================================
-- CORRECTION DES NUMÉROS DE DOCUMENTS
-- =====================================================

-- 1. CORRECTION PROFORMAS - Utiliser le bon nom de colonne
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
      SELECT 
        nfact as nproforma,  -- Garder nfact comme nproforma pour l''interface
        nclient,
        date_fact as date_proforma,
        montant_ht,
        timbre,
        tva,
        autre_taxe,
        (montant_ht + COALESCE(timbre,0) + COALESCE(tva,0) + COALESCE(autre_taxe,0)) as montant_ttc,
        marge,
        created_at,
        updated_at
      FROM %I.fprof 
      ORDER BY date_fact DESC, nfact DESC
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'table', p_tenant || '.fprof');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. CORRECTION BL - Utiliser le bon nom de colonne
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
      SELECT 
        nfact as nbl,  -- Garder nfact comme nbl pour l''interface
        nclient,
        date_fact as date_bl,
        montant_ht,
        timbre,
        tva,
        autre_taxe,
        (montant_ht + COALESCE(timbre,0) + COALESCE(tva,0) + COALESCE(autre_taxe,0)) as montant_ttc,
        marge,
        banq,
        ncheque,
        nbc,
        date_bc,
        nom_preneur,
        created_at,
        updated_at
      FROM %I.bl 
      ORDER BY date_fact DESC, nfact DESC
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'table', p_tenant || '.bl');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTS
-- =====================================================
-- SELECT get_proformas('2025_bu01');
-- SELECT get_delivery_notes('2025_bu01');