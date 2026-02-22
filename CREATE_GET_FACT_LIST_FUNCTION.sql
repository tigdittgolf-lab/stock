-- Create get_fact_list_enriched function for invoices list
-- This function returns the list of invoices with client information

DROP FUNCTION IF EXISTS get_fact_list_enriched(TEXT) CASCADE;

CREATE OR REPLACE FUNCTION get_fact_list_enriched(
    p_tenant TEXT
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSON;
BEGIN
    EXECUTE format('
        SELECT COALESCE(json_agg(
            json_build_object(
                ''nfact'', fact."NFact",
                ''nclient'', fact."Nclient",
                ''date_fact'', fact.date_fact,
                ''montant_ht'', COALESCE(fact.montant_ht, 0),
                ''tva'', COALESCE(fact."TVA", 0),
                ''montant_ttc'', COALESCE(fact.montant_ht, 0) + COALESCE(fact."TVA", 0) + COALESCE(fact.timbre, 0) + COALESCE(fact.autre_taxe, 0),
                ''client_name'', COALESCE(c."Raison_sociale", fact."Nclient"),
                ''timbre'', COALESCE(fact.timbre, 0),
                ''autre_taxe'', COALESCE(fact.autre_taxe, 0)
            )
            ORDER BY fact."NFact" DESC
        ), ''[]''::json)
        FROM "%1$s".fact
        LEFT JOIN "%1$s".client c ON fact."Nclient" = c."Nclient"
    ', p_tenant)
    INTO v_result;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_fact_list_enriched(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_enriched(TEXT) TO anon;

-- Test query
-- SELECT get_fact_list_enriched('2009_bu02');
