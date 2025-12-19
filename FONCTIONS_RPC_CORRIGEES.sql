-- =====================================================
-- FONCTIONS RPC CORRIGÉES AVEC LES VRAIES COLONNES
-- =====================================================

-- 1. FONCTION GET_ARTICLES (CORRIGÉE)
-- =====================================================
CREATE OR REPLACE FUNCTION get_articles(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Construire la requête avec les VRAIES colonnes
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        narticle,
        famille,
        designation,
        nfournisseur,
        prix_unitaire as prix_achat,
        prix_vente,
        marge,
        tva,
        stock_f,
        stock_bl,
        seuil as seuil_min
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

-- 2. FONCTION GET_CLIENTS (à vérifier aussi)
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
      SELECT *
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

-- 3. FONCTION GET_SUPPLIERS (à vérifier aussi)
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
      SELECT *
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

-- =====================================================
-- TEST APRÈS CORRECTION
-- =====================================================
-- Testez avec: SELECT get_articles('2025_bu01');