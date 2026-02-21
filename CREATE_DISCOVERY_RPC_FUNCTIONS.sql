-- ============================================================================
-- FONCTIONS RPC POUR LA DÉCOUVERTE AUTOMATIQUE DES SCHÉMAS ET TABLES
-- Ces fonctions permettent à l'interface web de fonctionner
-- ============================================================================

-- 0. Fonction exec_sql pour exécuter des requêtes SQL dynamiques (CRITIQUE pour la migration)
DROP FUNCTION IF EXISTS exec_sql(TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT, params TEXT[] DEFAULT '{}')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $exec_sql$
DECLARE
  v_result JSONB;
  v_table_name TEXT;
  v_schema_name TEXT;
  v_exists BOOLEAN;
  v_final_query TEXT;
  v_param_count INTEGER;
BEGIN
  -- CORRECTION CRITIQUE: Remplacer les placeholders $1, $2, $3... par les valeurs réelles
  -- IMPORTANT: Remplacer dans l'ordre INVERSE pour éviter que $1 remplace le $1 dans $10, $11, etc.
  v_final_query := sql_query;
  v_param_count := array_length(params, 1);
  
  IF v_param_count IS NOT NULL AND v_param_count > 0 THEN
    -- Remplacer chaque $N par la valeur correspondante (avec échappement)
    -- ORDRE INVERSE: du plus grand au plus petit
    FOR i IN REVERSE v_param_count..1 LOOP
      -- Échapper les valeurs NULL
      IF params[i] IS NULL THEN
        v_final_query := replace(v_final_query, '$' || i::text, 'NULL');
      ELSE
        -- CORRECTION: Détecter si c'est un nombre pour ne pas ajouter de quotes
        -- Si la valeur est un nombre valide, ne pas utiliser quote_literal
        IF params[i] ~ '^-?[0-9]+\.?[0-9]*$' THEN
          -- C'est un nombre, pas de quotes
          v_final_query := replace(v_final_query, '$' || i::text, params[i]);
        ELSE
          -- C'est une chaîne, utiliser quote_literal pour échapper
          v_final_query := replace(v_final_query, '$' || i::text, quote_literal(params[i]));
        END IF;
      END IF;
    END LOOP;
  END IF;
  
  -- Exécuter la requête SQL finale
  EXECUTE v_final_query;
  
  -- Si c'est un CREATE TABLE, vérifier que la table existe vraiment
  IF sql_query ILIKE '%CREATE TABLE%' THEN
    -- Extraire le nom de la table et du schéma
    v_schema_name := substring(sql_query from '"([^"]+)"\."');
    v_table_name := substring(sql_query from '\."([^"]+)"');
    
    IF v_schema_name IS NOT NULL AND v_table_name IS NOT NULL THEN
      -- Vérifier que la table existe
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = v_schema_name AND table_name = v_table_name
      ) INTO v_exists;
      
      IF NOT v_exists THEN
        RETURN jsonb_build_object(
          'success', false,
          'error', format('Table %s.%s was not created', v_schema_name, v_table_name),
          'verified', false
        );
      END IF;
      
      RETURN jsonb_build_object(
        'success', true,
        'executed', v_final_query,
        'verified', true,
        'table', format('%s.%s', v_schema_name, v_table_name)
      );
    END IF;
  END IF;
  
  -- Pour les autres requêtes, retourner succès
  RETURN jsonb_build_object(
    'success', true,
    'executed', v_final_query
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'sqlstate', SQLSTATE,
    'query', v_final_query
  );
END;
$exec_sql$;


-- 1. Découvrir tous les schémas tenant dans Supabase
DROP FUNCTION IF EXISTS discover_tenant_schemas();

CREATE OR REPLACE FUNCTION discover_tenant_schemas()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $discover_tenant_schemas$
DECLARE
  v_schemas JSONB;
BEGIN
  SELECT jsonb_agg(schema_name ORDER BY schema_name)
  INTO v_schemas
  FROM information_schema.schemata
  WHERE schema_name LIKE '%_bu%'
    AND schema_name NOT IN ('information_schema', 'pg_catalog', 'public', 'auth', 'extensions', 'graphql', 'graphql_public', 'pgsodium', 'pgsodium_masks', 'pgtle', 'realtime', 'storage', 'supabase_functions', 'supabase_migrations', 'vault');
  
  RETURN COALESCE(v_schemas, '[]'::JSONB);
END;
$discover_tenant_schemas$;

-- 1b. Découvrir TOUS les schémas (pour debug)
DROP FUNCTION IF EXISTS discover_all_schemas();

CREATE OR REPLACE FUNCTION discover_all_schemas()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $discover_all_schemas$
DECLARE
  v_schemas JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'schema_name', schema_name,
      'is_tenant', CASE WHEN schema_name LIKE '%_bu%' THEN true ELSE false END,
      'is_system', CASE WHEN schema_name IN ('information_schema', 'pg_catalog', 'public', 'auth', 'extensions', 'graphql', 'graphql_public', 'pgsodium', 'pgsodium_masks', 'pgtle', 'realtime', 'storage', 'supabase_functions', 'supabase_migrations', 'vault') THEN true ELSE false END
    ) ORDER BY schema_name
  )
  INTO v_schemas
  FROM information_schema.schemata;
  
  RETURN COALESCE(v_schemas, '[]'::JSONB);
END;
$discover_all_schemas$;

-- 2. Découvrir toutes les tables d'un schéma
DROP FUNCTION IF EXISTS discover_schema_tables(TEXT);

CREATE OR REPLACE FUNCTION discover_schema_tables(p_schema_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $discover_schema_tables$
DECLARE
  v_tables JSONB;
BEGIN
  SELECT jsonb_agg(
    jsonb_build_object(
      'table_name', table_name,
      'table_type', table_type
    ) ORDER BY table_name
  )
  INTO v_tables
  FROM information_schema.tables
  WHERE table_schema = p_schema_name
    AND table_type = 'BASE TABLE';
  
  RETURN COALESCE(v_tables, '[]'::JSONB);
END;
$discover_schema_tables$;

-- 3. Découvrir la structure complète d'une table
DROP FUNCTION IF EXISTS discover_table_structure(TEXT, TEXT);

CREATE OR REPLACE FUNCTION discover_table_structure(
  p_schema_name TEXT,
  p_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $discover_table_structure$
DECLARE
  v_columns JSONB;
  v_constraints JSONB;
  v_record_count INTEGER;
  v_sample_data JSONB;
BEGIN
  -- Colonnes
  SELECT jsonb_agg(
    jsonb_build_object(
      'column_name', column_name,
      'data_type', data_type,
      'character_maximum_length', character_maximum_length,
      'is_nullable', is_nullable,
      'column_default', column_default,
      'ordinal_position', ordinal_position
    ) ORDER BY ordinal_position
  )
  INTO v_columns
  FROM information_schema.columns
  WHERE table_schema = p_schema_name
    AND table_name = p_table_name;

  -- Contraintes
  SELECT jsonb_agg(
    jsonb_build_object(
      'constraint_name', tc.constraint_name,
      'constraint_type', tc.constraint_type,
      'column_name', kcu.column_name
    )
  )
  INTO v_constraints
  FROM information_schema.table_constraints tc
  LEFT JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
  WHERE tc.table_schema = p_schema_name
    AND tc.table_name = p_table_name;

  -- Compter les enregistrements
  EXECUTE format('SELECT COUNT(*) FROM %I.%I', p_schema_name, p_table_name)
  INTO v_record_count;

  -- Échantillon de données (2 lignes)
  EXECUTE format(
    'SELECT jsonb_agg(to_jsonb(t.*)) FROM (SELECT * FROM %I.%I LIMIT 2) t',
    p_schema_name,
    p_table_name
  )
  INTO v_sample_data;

  RETURN jsonb_build_object(
    'columns', COALESCE(v_columns, '[]'::JSONB),
    'constraints', COALESCE(v_constraints, '[]'::JSONB),
    'record_count', v_record_count,
    'sample_data', COALESCE(v_sample_data, '[]'::JSONB)
  );
END;
$discover_table_structure$;

-- 4. Obtenir toutes les données d'une table (pour migration)
DROP FUNCTION IF EXISTS get_all_table_data(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_all_table_data(
  p_schema_name TEXT,
  p_table_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $get_all_table_data$
DECLARE
  v_data JSONB;
BEGIN
  EXECUTE format(
    'SELECT jsonb_agg(to_jsonb(t.*)) FROM %I.%I t',
    p_schema_name,
    p_table_name
  )
  INTO v_data;
  
  RETURN COALESCE(v_data, '[]'::JSONB);
END;
$get_all_table_data$;

-- 5. Créer un schéma s'il n'existe pas
DROP FUNCTION IF EXISTS create_schema_if_not_exists(TEXT);

CREATE OR REPLACE FUNCTION create_schema_if_not_exists(p_schema_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $create_schema_if_not_exists$
DECLARE
  v_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe déjà
  SELECT EXISTS (
    SELECT 1 FROM information_schema.schemata WHERE schema_name = p_schema_name
  ) INTO v_exists;
  
  IF NOT v_exists THEN
    -- Créer le schéma s'il n'existe pas
    EXECUTE format('CREATE SCHEMA %I', p_schema_name);
    
    RETURN jsonb_build_object(
      'success', true,
      'created', true,
      'message', format('Schema %s created successfully', p_schema_name)
    );
  ELSE
    RETURN jsonb_build_object(
      'success', true,
      'created', false,
      'message', format('Schema %s already exists', p_schema_name)
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
$create_schema_if_not_exists$;

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. Copier tout ce fichier SQL
-- 2. Aller sur: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql
-- 3. Coller et exécuter
-- 4. Vérifier que les 6 fonctions sont créées sans erreur (exec_sql + 5 discovery functions)
-- 5. L'interface web /admin/database-migration devrait maintenant fonctionner

-- Tests (optionnel):
-- SELECT exec_sql('SELECT 1');
-- SELECT exec_sql('INSERT INTO "2009_bu02"."test" VALUES ($1, $2)', ARRAY['value1', 'value2']);
-- SELECT discover_tenant_schemas();
-- SELECT discover_schema_tables('2025_bu01');
-- SELECT discover_table_structure('2025_bu01', 'article');
