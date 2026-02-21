-- =====================================================
-- FIX RPC FUNCTIONS TO USE UPPERCASE COLUMN NAMES
-- For MySQL-migrated schemas where columns are uppercase
-- =====================================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS get_articles_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_clients_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_suppliers_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_fournisseurs_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_bl_list_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_bl_list(TEXT);
DROP FUNCTION IF EXISTS get_fact_list_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_fact_list(TEXT);
DROP FUNCTION IF EXISTS get_proforma_list_by_tenant(TEXT);
DROP FUNCTION IF EXISTS get_proforma_list(TEXT);

-- 1. Fix get_articles_by_tenant
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(json_build_object(
      ''narticle'', "Narticle",
      ''famille'', famille,
      ''designation'', designation,
      ''nfournisseur'', "Nfournisseur",
      ''prix_unitaire'', prix_unitaire,
      ''marge'', marge,
      ''tva'', tva,
      ''prix_vente'', prix_vente,
      ''seuil'', seuil,
      ''stock_f'', stock_f,
      ''stock_bl'', stock_bl
    ))
    FROM "%s".article 
    ORDER BY "Narticle" ASC', p_tenant)
  INTO result;
  RETURN COALESCE(result, ''[]''::json);
END;
$$;

-- 2. Fix get_clients_by_tenant
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(json_build_object(
      ''nclient'', "Nclient",
      ''nom'', "Nom_client",
      ''raison_sociale'', "Raison_sociale",
      ''adresse'', "Adresse_client",
      ''telephone'', "Tel",
      ''nif'', "NIF",
      ''nis'', "NIS",
      ''rc'', "RC",
      ''article'', "Article_client"
    ))
    FROM "%s".client 
    ORDER BY "Nclient" ASC', p_tenant)
  INTO result;
  RETURN COALESCE(result, ''[]''::json);
END;
$$;

-- 3. Fix get_suppliers_by_tenant (fournisseur table)
CREATE OR REPLACE FUNCTION get_suppliers_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM "%s".fournisseur ORDER BY "Nfournisseur" ASC) t', p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    -- Try supplier table if fournisseur doesn't exist
    BEGIN
      EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM "%s".supplier ORDER BY "Nfournisseur" ASC) t', p_tenant)
      INTO result;
      RETURN COALESCE(result, '[]'::json);
    EXCEPTION
      WHEN OTHERS THEN
        RETURN '[]'::json;
    END;
END;
$$;

-- 4. Alias for get_fournisseurs_by_tenant
CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_suppliers_by_tenant(p_tenant);
END;
$$;

-- 5. Fix get_bl_list_by_tenant (Bons de Livraison)
CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT b.*, c."Nclient" as nclient_code, c.raison_sociale as client_name
      FROM "%s".bl b
      LEFT JOIN "%s".client c ON b."Nclient" = c."Nclient"
      ORDER BY b."Nbl" DESC
    ) t', p_tenant, p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$;

-- 6. Alias for get_bl_list
CREATE OR REPLACE FUNCTION get_bl_list(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_bl_list_by_tenant(p_tenant);
END;
$$;

-- 7. Fix get_fact_list_by_tenant (Factures)
CREATE OR REPLACE FUNCTION get_fact_list_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT f.*, c."Nclient" as nclient_code, c.raison_sociale as client_name
      FROM "%s".fact f
      LEFT JOIN "%s".client c ON f."Nclient" = c."Nclient"
      ORDER BY f."Nfact" DESC
    ) t', p_tenant, p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$;

-- 8. Alias for get_fact_list
CREATE OR REPLACE FUNCTION get_fact_list(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_fact_list_by_tenant(p_tenant);
END;
$$;

-- 9. Fix get_proforma_list_by_tenant (Proformas)
CREATE OR REPLACE FUNCTION get_proforma_list_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT p.*, c."Nclient" as nclient_code, c.raison_sociale as client_name
      FROM "%s".fprof p
      LEFT JOIN "%s".client c ON p."Nclient" = c."Nclient"
      ORDER BY p."Nfact" DESC
    ) t', p_tenant, p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$;

-- 10. Alias for get_proforma_list
CREATE OR REPLACE FUNCTION get_proforma_list(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN get_proforma_list_by_tenant(p_tenant);
END;
$$;

-- Test the functions
SELECT 'Testing get_articles_by_tenant...' as test;
SELECT get_articles_by_tenant('2009_bu02');

SELECT 'Testing get_clients_by_tenant...' as test;
SELECT get_clients_by_tenant('2009_bu02');

SELECT 'Testing get_suppliers_by_tenant...' as test;
SELECT get_suppliers_by_tenant('2009_bu02');

SELECT 'Testing get_bl_list_by_tenant...' as test;
SELECT get_bl_list_by_tenant('2009_bu02');

SELECT 'Testing get_fact_list_by_tenant...' as test;
SELECT get_fact_list_by_tenant('2009_bu02');

SELECT 'Testing get_proforma_list_by_tenant...' as test;
SELECT get_proforma_list_by_tenant('2009_bu02');
