-- ============================================================================
-- MISE À JOUR DE LA FONCTION POUR RETOURNER LES RÉSULTATS
-- ============================================================================

DROP FUNCTION IF EXISTS execute_raw_sql(TEXT);

CREATE OR REPLACE FUNCTION execute_raw_sql(p_sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_record RECORD;
  v_results JSONB[] := '{}';
BEGIN
  -- Si c'est un SELECT, retourner les résultats
  IF UPPER(TRIM(p_sql)) LIKE 'SELECT%' THEN
    FOR v_record IN EXECUTE p_sql
    LOOP
      v_results := array_append(v_results, to_jsonb(v_record));
    END LOOP;
    
    RETURN jsonb_build_object(
      'success', true,
      'data', to_jsonb(v_results),
      'count', array_length(v_results, 1)
    );
  ELSE
    -- Pour INSERT, UPDATE, DELETE, TRUNCATE, etc.
    EXECUTE p_sql;
    
    RETURN jsonb_build_object(
      'success', true,
      'message', 'SQL executed successfully'
    );
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'sqlstate', SQLSTATE
    );
END;
$$;

-- Test
-- SELECT execute_raw_sql('SELECT * FROM "2025_bu01"."article" LIMIT 1');
