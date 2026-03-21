-- RPC pour récupérer une seule ligne par valeur d'ID
-- À exécuter dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION get_row_by_id(
  p_schema_name TEXT,
  p_table_name TEXT,
  p_id_column TEXT,
  p_id_value TEXT
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  BEGIN
    EXECUTE format(
      'SELECT row_to_json(t) FROM %I.%I t WHERE %I::TEXT = $1 LIMIT 1',
      p_schema_name, p_table_name, p_id_column
    ) INTO result USING p_id_value;
  EXCEPTION
    WHEN OTHERS THEN
      result := NULL;
  END;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION get_row_by_id(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_row_by_id(TEXT, TEXT, TEXT, TEXT) TO service_role;

-- RPC pour récupérer les lignes d'une table avec filtre
CREATE OR REPLACE FUNCTION get_table_rows_where(
  p_schema_name TEXT,
  p_table_name TEXT,
  p_id_column TEXT,
  p_id_value TEXT
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  BEGIN
    EXECUTE format(
      'SELECT json_agg(t) FROM %I.%I t WHERE %I::TEXT = $1',
      p_schema_name, p_table_name, p_id_column
    ) INTO result USING p_id_value;
  EXCEPTION
    WHEN OTHERS THEN
      result := '[]'::json;
  END;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

GRANT EXECUTE ON FUNCTION get_table_rows_where(TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_table_rows_where(TEXT, TEXT, TEXT, TEXT) TO service_role;
