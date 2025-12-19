-- =====================================================
-- CORRECTION BL SANS COLONNES INEXISTANTES
-- =====================================================

CREATE OR REPLACE FUNCTION get_delivery_notes(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT 
        nfact as nbl,
        nclient,
        date_fact as date_bl,
        montant_ht,
        timbre,
        tva,
        autre_taxe,
        (montant_ht + COALESCE(timbre,0) + COALESCE(tva,0) + COALESCE(autre_taxe,0)) as montant_ttc,
        -- Supprimer marge qui n''existe pas
        banq,
        ncheque,
        nbc,
        date_bc,
        nom_preneur,
        created_at,
        updated_at
      FROM %I.bl 
      ORDER BY date_fact DESC, nfact DESC
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('error', SQLERRM, 'table', p_tenant || '.bl');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test
-- SELECT get_delivery_notes('2025_bu01');