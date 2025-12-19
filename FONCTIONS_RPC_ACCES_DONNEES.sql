-- =====================================================
-- FONCTIONS RPC POUR ACCÈS AUX DONNÉES MULTI-TENANT
-- =====================================================
-- Ces fonctions permettent d'accéder aux données des schémas tenant
-- depuis les API routes Next.js

-- 1. FONCTION GET_ARTICLES
-- =====================================================
CREATE OR REPLACE FUNCTION get_articles(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Construire la requête dynamique
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        narticle,
        designation,
        prix_achat,
        prix_vente,
        stock_f,
        stock_bl,
        seuil_min,
        unite,
        tva,
        remise,
        created_at,
        updated_at
      FROM %I.article 
      ORDER BY designation
    ) t
  ', p_tenant);
  
  -- Exécuter la requête
  EXECUTE query_text INTO result;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. FONCTION GET_CLIENTS
-- =====================================================
CREATE OR REPLACE FUNCTION get_clients(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Construire la requête dynamique
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        nclient,
        nom_client,
        adresse,
        telephone,
        email,
        nif,
        rc,
        created_at,
        updated_at
      FROM %I.client 
      ORDER BY nom_client
    ) t
  ', p_tenant);
  
  -- Exécuter la requête
  EXECUTE query_text INTO result;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. FONCTION GET_SUPPLIERS
-- =====================================================
CREATE OR REPLACE FUNCTION get_suppliers(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Construire la requête dynamique
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        nfournisseur,
        nom_fournisseur,
        adresse,
        telephone,
        email,
        nif,
        rc,
        created_at,
        updated_at
      FROM %I.fournisseur 
      ORDER BY nom_fournisseur
    ) t
  ', p_tenant);
  
  -- Exécuter la requête
  EXECUTE query_text INTO result;
  
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FONCTION GET_DELIVERY_NOTES (BL)
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
        nbl,
        nclient,
        date_bl,
        montant_ht,
        montant_tva,
        montant_ttc,
        statut,
        created_at
      FROM %I.bl 
      ORDER BY date_bl DESC, nbl DESC
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FONCTION GET_INVOICES (Factures)
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
        montant_tva,
        montant_ttc,
        statut,
        created_at
      FROM %I.facture 
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

-- 6. FONCTION GET_PROFORMAS
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
        nproforma,
        nclient,
        date_proforma,
        montant_ht,
        montant_tva,
        montant_ttc,
        statut,
        created_at
      FROM %I.proforma 
      ORDER BY date_proforma DESC, nproforma DESC
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
-- INSTRUCTIONS D'INSTALLATION
-- =====================================================
-- 1. Copiez ce script dans l'éditeur SQL de Supabase
-- 2. Exécutez-le pour créer toutes les fonctions
-- 3. Les API routes Next.js pourront maintenant accéder aux données
-- 4. Test: SELECT get_articles('2025_bu01