-- Fix get_bl_by_id function with correct column names
-- This function is used by the PDF generation route

DROP FUNCTION IF EXISTS get_bl_by_id(TEXT, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_bl_by_id(
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
                bl."NFact" as nfact,
                bl."Nclient" as nclient,
                bl.date_fact,
                bl.montant_ht,
                bl."TVA" as tva,
                bl.montant_ht + COALESCE(bl."TVA", 0) as montant_ttc,
                c."Raison_sociale" as raison_sociale,
                c."Raison_sociale" as client_name,
                c.adresse as client_address,
                c."Tel" as client_phone,
                (
                    SELECT json_agg(
                        json_build_object(
                            ''narticle'', detail_bl."Narticle",
                            ''designation'', COALESCE(a.designation, detail_bl."Narticle"),
                            ''qte'', COALESCE(detail_bl."Qte", 0),
                            ''prix'', COALESCE(detail_bl.prix, 0),
                            ''tva'', COALESCE(detail_bl.tva, 0),
                            ''total_ligne'', COALESCE(detail_bl.total_ligne, 0)
                        )
                    )
                    FROM "%1$s".detail_bl
                    LEFT JOIN "%1$s".article a ON detail_bl."Narticle" = a."Narticle"
                    WHERE detail_bl."NFact" = bl."NFact"
                ) as details
            FROM "%1$s".bl
            LEFT JOIN "%1$s".client c ON bl."Nclient" = c."Nclient"
            WHERE bl."NFact" = $1
        ) t
    ', p_tenant)
    INTO v_result
    USING p_nfact;
    
    IF v_result IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'BL not found'
        );
    END IF;
    
    RETURN v_result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_bl_by_id(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bl_by_id(TEXT, INTEGER) TO anon;

-- Test query
SELECT get_bl_by_id('2009_bu02', 8703);
