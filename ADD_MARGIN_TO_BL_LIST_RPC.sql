-- Ajouter les colonnes marge à get_bl_list_by_tenant
DROP FUNCTION IF EXISTS get_bl_list_by_tenant(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(
      jsonb_build_object(
        ''nfact'', b."NFact",
        ''nclient'', b."Nclient",
        ''client_name'', COALESCE(c."Raison_sociale", b."Nclient"),
        ''date_fact'', b.date_fact,
        ''montant_ht'', COALESCE(b.montant_ht, 0),
        ''tva'', COALESCE(b."TVA", 0),
        ''timbre'', COALESCE(b.timbre, 0),
        ''autre_taxe'', COALESCE(b.autre_taxe, 0),
        ''facturer'', COALESCE(b.facturer, 0),
        ''marge'', COALESCE(b.marge, 0),
        ''marge_percent'', CASE 
          WHEN COALESCE(b.montant_ht, 0) > 0 
          THEN (COALESCE(b.marge, 0) / b.montant_ht) * 100 
          ELSE 0 
        END,
        ''created_at'', b.date_fact
      )
    )
    FROM %I.bl b
    LEFT JOIN %I.client c ON c."Nclient" = b."Nclient"
    ORDER BY b."NFact" DESC
  ', p_tenant, p_tenant)
  INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Même chose pour get_fact_list_enriched (factures)
DROP FUNCTION IF EXISTS get_fact_list_enriched(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_fact_list_enriched(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(
      jsonb_build_object(
        ''nfact'', f."NFact",
        ''nclient'', f."Nclient",
        ''client_name'', COALESCE(c."Raison_sociale", f."Nclient"),
        ''date_fact'', f.date_fact,
        ''montant_ht'', COALESCE(f.montant_ht, 0),
        ''tva'', COALESCE(f."TVA", 0),
        ''timbre'', COALESCE(f.timbre, 0),
        ''autre_taxe'', COALESCE(f.autre_taxe, 0),
        ''marge'', COALESCE(f.marge, 0),
        ''marge_percent'', CASE 
          WHEN COALESCE(f.montant_ht, 0) > 0 
          THEN (COALESCE(f.marge, 0) / f.montant_ht) * 100 
          ELSE 0 
        END,
        ''created_at'', f.date_fact
      )
    )
    FROM %I.fact f
    LEFT JOIN %I.client c ON c."Nclient" = f."Nclient"
    ORDER BY f."NFact" DESC
  ', p_tenant, p_tenant)
  INTO result;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_bl_list_by_tenant TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_enriched TO anon, authenticated;

-- Vérifier que ça fonctionne
SELECT 'Test get_bl_list_by_tenant avec marge' as info;
SELECT 
  json_array_elements(get_bl_list_by_tenant('2009_bu02'))->>'nfact' as nfact,
  json_array_elements(get_bl_list_by_tenant('2009_bu02'))->>'marge' as marge,
  json_array_elements(get_bl_list_by_tenant('2009_bu02'))->>'marge_percent' as marge_percent
FROM get_bl_list_by_tenant('2009_bu02')
LIMIT 5;
