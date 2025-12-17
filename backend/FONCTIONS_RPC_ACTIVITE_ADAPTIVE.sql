-- =====================================================
-- FONCTIONS RPC ADAPTATIVES POUR TABLE ACTIVITE EXISTANTE
-- =====================================================

-- Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS get_activities_by_tenant(text);
DROP FUNCTION IF EXISTS insert_activity_to_tenant(text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS update_activity_in_tenant(text,integer,text,text,text,text,text,text,text,text);

-- Fonction adaptative qui s'ajuste à votre structure existante
CREATE OR REPLACE FUNCTION get_activities_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
  result JSON;
  query_text TEXT;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN json_build_object('success', false, 'error', 'Schema not found', 'data', '[]'::json);
  END IF;
  
  -- Vérifier si la table activite existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'activite'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN json_build_object('success', false, 'error', 'Table activite not found', 'data', '[]'::json);
  END IF;
  
  -- Construire une requête adaptative basée sur les colonnes existantes
  query_text := format('
    SELECT json_agg(
      json_build_object(
        ''id'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''id'') 
               THEN id::text ELSE ''1'' END, ''1'')::integer,
        ''nom_entreprise'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''nom_entreprise'') 
               THEN nom_entreprise 
               WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''nom'') 
               THEN nom
               ELSE ''Mon Entreprise'' END, ''Mon Entreprise''),
        ''adresse'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''adresse'') 
               THEN adresse ELSE '''' END, ''''),
        ''telephone'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''telephone'') 
               THEN telephone 
               WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''tel'') 
               THEN tel
               ELSE '''' END, ''''),
        ''email'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''email'') 
               THEN email ELSE '''' END, ''''),
        ''nif'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''nif'') 
               THEN nif ELSE '''' END, ''''),
        ''rc'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''rc'') 
               THEN rc ELSE '''' END, ''''),
        ''activite'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''activite'') 
               THEN activite 
               WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''description'') 
               THEN description
               ELSE '''' END, ''''),
        ''slogan'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''slogan'') 
               THEN slogan ELSE '''' END, ''''),
        ''created_at'', COALESCE(
          CASE WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = ''%s'' AND table_name = ''activite'' AND column_name = ''created_at'') 
               THEN created_at::text ELSE CURRENT_TIMESTAMP::text END, CURRENT_TIMESTAMP::text)
      )
    ) FROM %I.activite LIMIT 1
  ', p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant, p_tenant);
  
  -- Exécuter la requête adaptative
  EXECUTE query_text INTO result;
  
  -- Si aucun résultat, créer un objet par défaut
  IF result IS NULL THEN
    result := json_build_array(
      json_build_object(
        'id', 1,
        'nom_entreprise', 'Mon Entreprise',
        'adresse', '',
        'telephone', '',
        'email', '',
        'nif', '',
        'rc', '',
        'activite', '',
        'slogan', '',
        'created_at', CURRENT_TIMESTAMP
      )
    );
  END IF;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', SQLERRM, 'data', '[]'::json);
END;
$function$;

-- Fonction simple pour récupérer les colonnes de la table
CREATE OR REPLACE FUNCTION debug_activite_structure(p_tenant TEXT)
RETURNS TABLE(column_name TEXT, data_type TEXT)
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY 
  SELECT c.column_name::TEXT, c.data_type::TEXT
  FROM information_schema.columns c
  WHERE c.table_schema = p_tenant 
  AND c.table_name = 'activite'
  ORDER BY c.ordinal_position;
END;
$function$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_activities_by_tenant TO anon, authenticated;
GRANT EXECUTE ON FUNCTION debug_activite_structure TO anon, authenticated;