-- ============================================================================
-- FONCTIONS RPC POUR LA MIGRATION MYSQL → SUPABASE
-- À exécuter dans le SQL Editor de Supabase
-- URL: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
-- ============================================================================

-- 1. Fonction pour insérer des données dans un schéma tenant
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
  v_columns TEXT[];
  v_values TEXT[];
  v_key TEXT;
  v_value TEXT;
BEGIN
  -- Construire la liste des colonnes et valeurs
  FOR v_key IN SELECT jsonb_object_keys(p_data)
  LOOP
    v_columns := array_append(v_columns, quote_ident(v_key));
    v_value := quote_literal(p_data->>v_key);
    v_values := array_append(v_values, v_value);
  END LOOP;

  -- Construire et exécuter la requête INSERT
  v_sql := format(
    'INSERT INTO %I.%I (%s) VALUES (%s) RETURNING to_jsonb(%I.*)',
    p_schema_name,
    p_table_name,
    array_to_string(v_columns, ', '),
    array_to_string(v_values, ', '),
    p_table_name
  );

  EXECUTE v_sql INTO v_result;

  RETURN jsonb_build_object(
    'success', true,
    'data', v_result
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- 2. Fonction pour insérer plusieurs enregistrements (batch)
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
  v_sql TEXT;
  v_result JSONB;
  v_inserted_count INTEGER := 0;
  v_record JSONB;
BEGIN
  -- Insérer chaque enregistrement
  FOREACH v_record IN ARRAY p_data
  LOOP
    BEGIN
      v_result := insert_into_tenant_table(p_schema_name, p_table_name, v_record);
      
      IF (v_result->>'success')::BOOLEAN THEN
        v_inserted_count := v_inserted_count + 1;
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Continuer avec les autres enregistrements
        CONTINUE;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'inserted_count', v_inserted_count,
    'total_count', array_length(p_data, 1)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- 3. Fonction pour compter les enregistrements dans une table tenant
CREATE OR REPLACE FUNCTION count_tenant_table_records(
  p_schema_name TEXT,
  p_table_name TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
  v_count INTEGER;
BEGIN
  v_sql := format('SELECT COUNT(*) FROM %I.%I', p_schema_name, p_table_name);
  EXECUTE v_sql INTO v_count;
  RETURN v_count;
EXCEPTION
  WHEN OTHERS THEN
    RETURN -1;
END;
$$;

-- 4. Fonction pour supprimer toutes les données d'une table tenant
CREATE OR REPLACE FUNCTION truncate_tenant_table(
  p_schema_name TEXT,
  p_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
BEGIN
  v_sql := format('TRUNCATE TABLE %I.%I CASCADE', p_schema_name, p_table_name);
  EXECUTE v_sql;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', format('Table %s.%s truncated', p_schema_name, p_table_name)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- 5. Fonction pour lire des données d'une table tenant
CREATE OR REPLACE FUNCTION get_tenant_table_data(
  p_schema_name TEXT,
  p_table_name TEXT,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sql TEXT;
  v_result JSONB;
BEGIN
  v_sql := format(
    'SELECT jsonb_agg(to_jsonb(%I.*)) FROM %I.%I LIMIT %s OFFSET %s',
    p_table_name,
    p_schema_name,
    p_table_name,
    p_limit,
    p_offset
  );
  
  EXECUTE v_sql INTO v_result;
  
  RETURN jsonb_build_object(
    'success', true,
    'data', COALESCE(v_result, '[]'::JSONB)
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- ============================================================================
-- INSTRUCTIONS D'UTILISATION
-- ============================================================================

-- 1. Copier tout ce fichier SQL
-- 2. Aller sur: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
-- 3. Coller le SQL dans l'éditeur
-- 4. Cliquer sur "Run" pour exécuter
-- 5. Vérifier que les 5 fonctions sont créées sans erreur
-- 6. Relancer le script de migration Node.js

-- Test des fonctions (optionnel):
-- SELECT count_tenant_table_records('2025_bu01', 'article');
-- SELECT get_tenant_table_data('2025_bu01', 'article', 10, 0);
