-- Fix get_fact_by_id and get_fprof_by_id functions with correct column names
-- These functions are used by PDF generation routes

-- ===== FACTURES (INVOICES) =====

DROP FUNCTION IF EXISTS get_fact_by_id(TEXT, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_fact_by_id(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSON;
BEGIN
    EXECUTE format('
        SELECT row_to_json(t) 
        FROM (
            SELECT 
                fact."NFact" as nfact,
                fact."Nclient" as nclient,
                fact.date_fact,
                fact.montant_ht,
                fact."TVA" as tva,
                fact.timbre,
                fact.autre_taxe,
                fact.montant_ht + COALESCE(fact."TVA", 0) + COALESCE(fact.timbre, 0) + COALESCE(fact.autre_taxe, 0) as montant_ttc,
                c."Raison_sociale" as raison_sociale,
                c."Raison_sociale" as client_name,
                c.adresse as client_address,
                c."Tel" as client_phone,
                (
                    SELECT json_agg(
                        json_build_object(
                            ''narticle'', detail_fact."Narticle",
                            ''designation'', COALESCE(a.designation, detail_fact."Narticle"),
                            ''qte'', COALESCE(detail_fact."Qte", 0),
                            ''prix'', COALESCE(detail_fact.prix, 0),
                            ''tva'', COALESCE(detail_fact.tva, 0),
                            ''pr_achat'', COALESCE(detail_fact.pr_achat, 0),
                            ''total_ligne'', COALESCE(detail_fact.total_ligne, 0)
                        )
                    )
                    FROM "%1$s".detail_fact
                    LEFT JOIN "%1$s".article a ON detail_fact."Narticle" = a."Narticle"
                    WHERE detail_fact."NFact" = fact."NFact"
                ) as details
            FROM "%1$s".fact
            LEFT JOIN "%1$s".client c ON fact."Nclient" = c."Nclient"
            WHERE fact."NFact" = $1
        ) t
    ', p_tenant)
    INTO v_result
    USING p_nfact;
    
    IF v_result IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Invoice not found'
        );
    END IF;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_fact_by_id(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fact_by_id(TEXT, INTEGER) TO anon;

-- ===== PROFORMA (DEVIS) =====

DROP FUNCTION IF EXISTS get_fprof_by_id(TEXT, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_fprof_by_id(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_result JSON;
BEGIN
    EXECUTE format('
        SELECT row_to_json(t) 
        FROM (
            SELECT 
                fprof."NFact" as nfact,
                fprof."Nclient" as nclient,
                fprof.date_fact,
                fprof.montant_ht,
                fprof."TVA" as tva,
                fprof.timbre,
                fprof.autre_taxe,
                fprof.montant_ht + COALESCE(fprof."TVA", 0) + COALESCE(fprof.timbre, 0) + COALESCE(fprof.autre_taxe, 0) as montant_ttc,
                c."Raison_sociale" as raison_sociale,
                c."Raison_sociale" as client_name,
                c.adresse as client_address,
                c."Tel" as client_phone,
                (
                    SELECT json_agg(
                        json_build_object(
                            ''narticle'', detail_fprof."Narticle",
                            ''designation'', COALESCE(a.designation, detail_fprof."Narticle"),
                            ''qte'', COALESCE(detail_fprof."Qte", 0),
                            ''prix'', COALESCE(detail_fprof.prix, 0),
                            ''tva'', COALESCE(detail_fprof.tva, 0),
                            ''pr_achat'', COALESCE(detail_fprof.pr_achat, 0),
                            ''total_ligne'', COALESCE(detail_fprof.total_ligne, 0)
                        )
                    )
                    FROM "%1$s".detail_fprof
                    LEFT JOIN "%1$s".article a ON detail_fprof."Narticle" = a."Narticle"
                    WHERE detail_fprof."NFact" = fprof."NFact"
                ) as details
            FROM "%1$s".fprof
            LEFT JOIN "%1$s".client c ON fprof."Nclient" = c."Nclient"
            WHERE fprof."NFact" = $1
        ) t
    ', p_tenant)
    INTO v_result
    USING p_nfact;
    
    IF v_result IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Proforma not found'
        );
    END IF;
    
    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_fprof_by_id(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_fprof_by_id(TEXT, INTEGER) TO anon;

-- Test queries
-- SELECT get_fact_by_id('2009_bu02', 1);
-- SELECT get_fprof_by_id('2009_bu02', 1);
