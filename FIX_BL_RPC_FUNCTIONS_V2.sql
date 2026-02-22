-- FIX BL RPC FUNCTIONS - Version 2 - NOMS DE COLONNES CORRECTS
-- Problème: Les noms de colonnes ne correspondent pas à la structure réelle

-- ÉTAPE 1: Supprimer les anciennes versions
DROP FUNCTION IF EXISTS get_bl_list_by_tenant(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_fact_list_by_tenant(TEXT) CASCADE;

-- ÉTAPE 2: Recréer get_bl_list_by_tenant avec les VRAIS noms de colonnes
CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json)
    FROM (
      SELECT 
        bl."NFact" as nfact,
        bl."Nclient" as nclient,
        bl.date_fact,
        COALESCE(bl.montant_ht, 0) as montant_ht,
        COALESCE(bl."TVA", 0) as tva,
        COALESCE(c."Raison_sociale", bl."Nclient") as client_name
      FROM "%s".bl bl
      LEFT JOIN "%s".client c ON c."Nclient" = bl."Nclient"
      ORDER BY bl."NFact" DESC
    ) t
  ', p_tenant, p_tenant)
  INTO result;
  
  RETURN result;
END;
$$;

-- ÉTAPE 3: Recréer get_fact_list_by_tenant avec les VRAIS noms de colonnes
CREATE OR REPLACE FUNCTION get_fact_list_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT COALESCE(json_agg(row_to_json(t)), ''[]''::json)
    FROM (
      SELECT 
        f."NFact" as nfact,
        f."Nclient" as nclient,
        f.date_fact,
        COALESCE(f.montant_ht, 0) as montant_ht,
        COALESCE(f."TVA", 0) as tva,
        COALESCE(c."Raison_sociale", f."Nclient") as client_name
      FROM "%s".fact f
      LEFT JOIN "%s".client c ON c."Nclient" = f."Nclient"
      ORDER BY f."NFact" DESC
    ) t
  ', p_tenant, p_tenant)
  INTO result;
  
  RETURN result;
END;
$$;

-- ÉTAPE 4: Accorder les permissions
GRANT EXECUTE ON FUNCTION get_bl_list_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bl_list_by_tenant(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_fact_list_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_by_tenant(TEXT) TO anon;

-- ÉTAPE 5: Test
SELECT 'Test get_bl_list_by_tenant' as test;
SELECT get_bl_list_by_tenant('2009_bu02');

SELECT 'Nombre de BL retournés' as test;
SELECT json_array_length(get_bl_list_by_tenant('2009_bu02')) as count;
