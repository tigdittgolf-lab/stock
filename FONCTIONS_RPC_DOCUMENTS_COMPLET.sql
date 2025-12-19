-- =====================================================
-- FONCTIONS RPC POUR TOUS LES DOCUMENTS
-- =====================================================

-- 1. BL VENTE (Bons de Livraison)
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
        nfact as nbl,
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
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FACTURES VENTE
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
      SELECT 
        nfact,
        nclient,
        date_fact,
        montant_ht,
        timbre,
        tva,
        autre_taxe,
        (montant_ht + COALESCE(timbre,0) + COALESCE(tva,0) + COALESCE(autre_taxe,0)) as montant_ttc,
        facturer,
        banq,
        ncheque,
        nbc,
        date_bc,
        nom_preneur,
        created_at,
        updated_at
      FROM %I.fact 
      ORDER BY date_fact DESC, nfact DESC
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. PROFORMAS
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
        nfact as nproforma,
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
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. BL ACHAT (Bons de Livraison Achat)
-- =====================================================
CREATE OR REPLACE FUNCTION get_purchase_delivery_notes(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        nbl_achat,
        nfournisseur,
        numero_bl_fournisseur,
        date_bl,
        montant_ht,
        timbre,
        tva,
        autre_taxe,
        (montant_ht + COALESCE(timbre,0) + COALESCE(tva,0) + COALESCE(autre_taxe,0)) as montant_ttc,
        created_at,
        updated_at
      FROM %I.bl_achat 
      ORDER BY date_bl DESC, nbl_achat DESC
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FACTURES ACHAT
-- =====================================================
CREATE OR REPLACE FUNCTION get_purchase_invoices(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        nfact_achat,
        nfournisseur,
        numero_facture_fournisseur,
        date_fact,
        montant_ht,
        timbre,
        tva,
        autre_taxe,
        (montant_ht + COALESCE(timbre,0) + COALESCE(tva,0) + COALESCE(autre_taxe,0)) as montant_ttc,
        payer,
        banq,
        ncheque,
        created_at,
        updated_at
      FROM %I.facture_achat 
      ORDER BY date_fact DESC, nfact_achat DESC
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- FONCTIONS POUR LES DÉTAILS DES DOCUMENTS
-- =====================================================

-- 6. DÉTAILS BL VENTE
-- =====================================================
CREATE OR REPLACE FUNCTION get_delivery_note_details(p_tenant TEXT, p_nbl INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT *
      FROM %I.detail_bl 
      WHERE nfact = %s
      ORDER BY narticle
    ) t
  ', p_tenant, p_nbl);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. DÉTAILS FACTURES VENTE
-- =====================================================
CREATE OR REPLACE FUNCTION get_invoice_details(p_tenant TEXT, p_nfact INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT *
      FROM %I.detail_fact 
      WHERE nfact = %s
      ORDER BY narticle
    ) t
  ', p_tenant, p_nfact);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. DÉTAILS PROFORMAS
-- =====================================================
CREATE OR REPLACE FUNCTION get_proforma_details(p_tenant TEXT, p_nproforma INTEGER)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT *
      FROM %I.detail_fprof 
      WHERE nfact = %s
      ORDER BY narticle
    ) t
  ', p_tenant, p_nproforma);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTS
-- =====================================================
-- SELECT get_delivery_notes('2025_bu01');
-- SELECT get_invoices('2025_bu01');
-- SELECT get_proformas('2025_bu01');
-- SELECT get_purchase_delivery_notes('2025_bu01');
-- SELECT get_purchase_invoices('2025_bu01');