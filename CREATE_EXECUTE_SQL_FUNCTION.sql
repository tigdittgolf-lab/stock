-- ============================================================================
-- FONCTION RPC SIMPLE POUR EXÉCUTER DU SQL BRUT
-- À exécuter dans le SQL Editor de Supabase
-- ============================================================================

CREATE OR REPLACE FUNCTION execute_raw_sql(p_sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Exécuter le SQL
  EXECUTE p_sql;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'SQL executed successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Test de la fonction
-- SELECT execute_raw_sql('SELECT 1');
