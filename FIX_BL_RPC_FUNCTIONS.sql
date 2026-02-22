-- FIX BL RPC FUNCTIONS - Corriger les noms de colonnes avec majuscules
-- Problème: Les colonnes dans la base ont des majuscules mais les fonctions utilisent des minuscules

-- ÉTAPE 1: Supprimer les anciennes versions
DROP FUNCTION IF EXISTS get_bl_list_by_tenant(TEXT) CASCADE;
DROP FUNCTION IF EXISTS get_fact_list_by_tenant(TEXT) CASCADE;

-- ÉTAPE 2: Recréer get_bl_list_by_tenant avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(
      jsonb_build_object(
        ''nfact'', bl."Nfact",
        ''nclient'', bl."Nclient",
        ''date_fact'', bl."Date_fact",
        ''montant_ht'', COALESCE(bl."Montant_HT", 0),
        ''tva'', COALESCE(bl."TVA", 0),
        ''created_at'', bl.created_at,
        ''client_name'', COALESCE(c."Raison_sociale", bl."Nclient")
      )
    )
    FROM "%s".bl bl
    LEFT JOIN "%s".client c ON c."Nclient" = bl."Nclient"
    ORDER BY bl."Nfact" DESC
  ', p_tenant, p_tenant)
  INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ÉTAPE 3: Recréer get_fact_list_by_tenant avec les bons noms de colonnes
CREATE OR REPLACE FUNCTION get_fact_list_by_tenant(p_tenant TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(
      jsonb_build_object(
        ''nfact'', f."Nfact",
        ''nclient'', f."Nclient",
        ''date_fact'', f."Date_fact",
        ''montant_ht'', COALESCE(f."Montant_HT", 0),
        ''tva'', COALESCE(f."TVA", 0),
        ''created_at'', f.created_at,
        ''client_name'', COALESCE(c."Raison_sociale", f."Nclient")
      )
    )
    FROM "%s".fact f
    LEFT JOIN "%s".client c ON c."Nclient" = f."Nclient"
    ORDER BY f."Nfact" DESC
  ', p_tenant, p_tenant)
  INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- ÉTAPE 4: Accorder les permissions
GRANT EXECUTE ON FUNCTION get_bl_list_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bl_list_by_tenant(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_fact_list_by_tenant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_by_tenant(TEXT) TO anon;

-- ÉTAPE 5: Test (décommenter pour tester)
-- SELECT get_bl_list_by_tenant('2009_bu02');
-- SELECT get_fact_list_by_tenant('2009_bu02');

-- ÉTAPE 6: Vérifier les colonnes réelles dans la table bl
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = '2009_bu02' 
--   AND table_name = 'bl'
-- ORDER BY ordinal_position;
