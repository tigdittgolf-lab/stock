-- =====================================================
-- FONCTIONS RPC CLIENTS ET FOURNISSEURS CORRIGÉES
-- =====================================================

-- 1. FONCTION GET_CLIENTS (avec vraies colonnes)
-- =====================================================
CREATE OR REPLACE FUNCTION get_clients(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Construire la requête avec les VRAIES colonnes clients
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        nclient,
        raison_sociale as nom_client,
        adresse,
        contact_person,
        tel as telephone,
        email,
        nrc as rc,
        i_fiscal as nif,
        c_affaire_fact,
        c_affaire_bl,
        date_rc,
        lieu_rc,
        n_article,
        commentaire
      FROM %I.client 
      ORDER BY raison_sociale
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

-- 2. FONCTION GET_SUPPLIERS (avec vraies colonnes)
-- =====================================================
CREATE OR REPLACE FUNCTION get_suppliers(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Construire la requête avec les VRAIES colonnes fournisseurs
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        nfournisseur,
        nom_fournisseur,
        resp_fournisseur,
        adresse_fourni as adresse,
        tel as telephone,
        tel1,
        tel2,
        email,
        caf,
        cabl,
        commentaire
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
-- TESTS
-- =====================================================
-- SELECT get_clients('2025_bu01');
-- SELECT get_suppliers('2025_bu01');