-- ============================================================================
-- CORRECTION DE LA FONCTION D'INSERTION
-- Gère mieux les colonnes NULL et les types de données
-- ============================================================================

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS insert_into_tenant_table(TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS insert_batch_into_tenant_table(TEXT, TEXT, JSONB[]);

-- Nouvelle fonction d'insertion améliorée
CREATE OR REPLACE FUNCTION insert_into_tenant_table(
  p_schema_name TEXT,
  p_table_name TEXT,
  p_data JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
  v_result JSONB;
  v_columns TEXT[] := '{}';
  v_placeholders TEXT[] := '{}';
  v_values TEXT[] := '{}';
  v_key TEXT;
  v_value TEXT;
  v_counter INTEGER := 0;
BEGIN
  -- Construire la liste des colonnes, placeholders et valeurs
  FOR v_key IN SELECT jsonb_object_keys(p_data)
  LOOP
    v_counter := v_counter + 1;
    v_columns := array_append(v_columns, quote_ident(v_key));
    v_placeholders := array_append(v_placeholders, '$' || v_counter);
    
    -- Gérer les valeurs NULL
    IF p_data->v_key = 'null'::jsonb THEN
      v_values := array_append(v_values, NULL);
    ELSE
      v_values := array_append(v_values, p_data->>v_key);
    END IF;
  END LOOP;

  -- Construire la requête INSERT avec RETURNING
  v_sql := format(
    'INSERT INTO %I.%I (%s) VALUES (%s) RETURNING to_jsonb(%I.*)',
    p_schema_name,
    p_table_name,
    array_to_string(v_columns, ', '),
    array_to_string(v_placeholders, ', '),
    p_table_name
  );

  -- Exécuter avec les valeurs comme paramètres
  EXECUTE v_sql INTO v_result USING VARIADIC v_values;

  RETURN jsonb_build_object(
    'success', true,
    'data', v_result
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE,
      'sql', v_sql
    );
END;
$$;

-- Fonction batch améliorée
CREATE OR REPLACE FUNCTION insert_batch_into_tenant_table(
  p_schema_name TEXT,
  p_table_name TEXT,
  p_data JSONB[]
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_inserted_count INTEGER := 0;
  v_failed_count INTEGER := 0;
  v_record JSONB;
  v_errors JSONB[] := '{}';
BEGIN
  -- Insérer chaque enregistrement
  FOREACH v_record IN ARRAY p_data
  LOOP
    BEGIN
      v_result := insert_into_tenant_table(p_schema_name, p_table_name, v_record);
      
      IF (v_result->>'success')::BOOLEAN THEN
        v_inserted_count := v_inserted_count + 1;
      ELSE
        v_failed_count := v_failed_count + 1;
        v_errors := array_append(v_errors, v_result);
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        v_failed_count := v_failed_count + 1;
        v_errors := array_append(v_errors, jsonb_build_object(
          'error', SQLERRM,
          'detail', SQLSTATE
        ));
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', v_inserted_count > 0,
    'inserted_count', v_inserted_count,
    'failed_count', v_failed_count,
    'total_count', array_length(p_data, 1),
    'errors', to_jsonb(v_errors)
  );
END;
$$;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Copier ce fichier SQL
-- 2. Aller sur: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
-- 3. Coller et exécuter
-- 4. Relancer: node migrate-via-rpc.js
