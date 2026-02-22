-- Créer la fonction pour récupérer un BL avec ses détails
-- Cette fonction retourne l'en-tête du BL et toutes ses lignes de détail

DROP FUNCTION IF EXISTS get_bl_with_details(TEXT, INTEGER) CASCADE;

CREATE OR REPLACE FUNCTION get_bl_with_details(
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
        SELECT json_build_object(
            ''success'', true,
            ''nfact'', bl."NFact",
            ''nclient'', bl."Nclient",
            ''client_name'', COALESCE(c."Raison_sociale", bl."Nclient"),
            ''date_fact'', bl.date_fact,
            ''montant_ht'', COALESCE(bl.montant_ht, 0),
            ''tva'', COALESCE(bl."TVA", 0),
            ''montant_ttc'', COALESCE(bl.montant_ht, 0) + COALESCE(bl."TVA", 0),
            ''details'', COALESCE(
                (
                    SELECT json_agg(
                        json_build_object(
                            ''narticle'', d."Narticle",
                            ''designation'', COALESCE(a.designation, d."Narticle"),
                            ''qte'', COALESCE(d."Qte", 0),
                            ''prix'', COALESCE(d.prix, 0),
                            ''tva'', COALESCE(d.tva, 0),
                            ''total_ligne'', COALESCE(d.total_ligne, 0)
                        )
                    )
                    FROM "%s".detail_bl d
                    LEFT JOIN "%s".article a ON a."Narticle" = d."Narticle"
                    WHERE d."NFact" = bl."NFact"
                ),
                ''[]''::json
            )
        )
        FROM "%s".bl bl
        LEFT JOIN "%s".client c ON c."Nclient" = bl."Nclient"
        WHERE bl."NFact" = $1
    ', p_tenant, p_tenant, p_tenant, p_tenant)
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

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_bl_with_details(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_bl_with_details(TEXT, INTEGER) TO anon;

-- Test (décommenter pour tester)
-- SELECT get_bl_with_details('2009_bu02', 8703);
