-- =====================================================
-- CORRECTION FONCTION RPC BL VENTE
-- =====================================================

-- Version simplifiée pour identifier le problème
CREATE OR REPLACE FUNCTION get_delivery_notes(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Version simple avec SELECT * pour voir toutes les colonnes
  query_text := format('
    SELECT json_agg(row_to_json(t)) 
    FROM (
      SELECT *
      FROM %I.bl 
      ORDER BY date_fact DESC
      LIMIT 10
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    -- Retourner l'erreur pour debug
    RETURN json_build_object('error', SQLERRM, 'table', p_tenant || '.bl');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test de la fonction
-- SELECT get_delivery_notes('2025_bu01');