-- =====================================================
-- FONCTIONS RPC POUR GESTION DE LA TABLE ACTIVITE (CORRIGÉE)
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS get_activities_by_tenant(text);
DROP FUNCTION IF EXISTS insert_activity_to_tenant(text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS update_activity_in_tenant(text,integer,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS delete_activity_from_tenant(text,integer);

-- 1. Récupérer toutes les activités d'un tenant (VERSION CORRIGÉE)
CREATE OR REPLACE FUNCTION get_activities_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  id INTEGER,
  nom_entreprise TEXT,
  adresse TEXT,
  telephone TEXT,
  email TEXT,
  nif TEXT,
  rc TEXT,
  activite TEXT,
  slogan TEXT,
  created_at TIMESTAMP
)
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
  column_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RAISE EXCEPTION 'Schema % does not exist', p_tenant;
  END IF;
  
  -- Vérifier si la table activite existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'activite'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      -- Créer la table activite si elle n'existe pas
      EXECUTE format('
          CREATE TABLE %I.activite (
              id SERIAL PRIMARY KEY,
              nom_entreprise VARCHAR(255) NOT NULL DEFAULT ''Mon Entreprise'',
              adresse TEXT DEFAULT '''',
              telephone VARCHAR(50) DEFAULT '''',
              email VARCHAR(100) DEFAULT '''',
              nif VARCHAR(50) DEFAULT '''',
              rc VARCHAR(50) DEFAULT '''',
              activite TEXT DEFAULT '''',
              slogan TEXT DEFAULT '''',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
      ', p_tenant);
      
      -- Insérer une activité par défaut
      EXECUTE format('
          INSERT INTO %I.activite (nom_entreprise, adresse, activite)
          VALUES (''Mon Entreprise'', ''Adresse de l''''entreprise'', ''Activité principale'')
      ', p_tenant);
  ELSE
      -- Vérifier et ajouter les colonnes manquantes si nécessaire
      
      -- Vérifier si la colonne activite existe
      SELECT EXISTS(
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = p_tenant AND table_name = 'activite' AND column_name = 'activite'
      ) INTO column_exists;
      
      IF NOT column_exists THEN
          EXECUTE format('ALTER TABLE %I.activite ADD COLUMN activite TEXT DEFAULT ''''', p_tenant);
      END IF;
      
      -- Vérifier et ajouter d'autres colonnes si nécessaires
      IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_tenant AND table_name = 'activite' AND column_name = 'slogan') THEN
          EXECUTE format('ALTER TABLE %I.activite ADD COLUMN slogan TEXT DEFAULT ''''', p_tenant);
      END IF;
      
      IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_tenant AND table_name = 'activite' AND column_name = 'id') THEN
          EXECUTE format('ALTER TABLE %I.activite ADD COLUMN id SERIAL PRIMARY KEY', p_tenant);
      END IF;
      
      IF NOT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = p_tenant AND table_name = 'activite' AND column_name = 'created_at') THEN
          EXECUTE format('ALTER TABLE %I.activite ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP', p_tenant);
      END IF;
  END IF;
  
  -- Retourner toutes les activités avec gestion des colonnes manquantes
  RETURN QUERY EXECUTE format('
      SELECT 
          COALESCE(id, 1) as id,
          COALESCE(nom_entreprise, ''Mon Entreprise'') as nom_entreprise,
          COALESCE(adresse, '''') as adresse,
          COALESCE(telephone, '''') as telephone,
          COALESCE(email, '''') as email,
          COALESCE(nif, '''') as nif,
          COALESCE(rc, '''') as rc,
          COALESCE(activite, '''') as activite,
          COALESCE(slogan, '''') as slogan,
          COALESCE(created_at, CURRENT_TIMESTAMP) as created_at
      FROM %I.activite
      ORDER BY COALESCE(id, 1)
      LIMIT 1
  ', p_tenant);
  
EXCEPTION
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Error in get_activities_by_tenant: %', SQLERRM;
END;
$function$;

-- 2. Insérer une nouvelle activité (VERSION CORRIGÉE)
CREATE OR REPLACE FUNCTION insert_activity_to_tenant(
  p_tenant TEXT,
  p_nom_entreprise TEXT,
  p_adresse TEXT DEFAULT '',
  p_telephone TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_nif TEXT DEFAULT '',
  p_rc TEXT DEFAULT '',
  p_activite TEXT DEFAULT '',
  p_slogan TEXT DEFAULT ''
)
RETURNS INTEGER
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
  new_id INTEGER;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RAISE EXCEPTION 'Schema % does not exist', p_tenant;
  END IF;
  
  -- Vérifier si la table activite existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'activite'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      -- Créer la table activite si elle n'existe pas
      EXECUTE format('
          CREATE TABLE %I.activite (
              id SERIAL PRIMARY KEY,
              nom_entreprise VARCHAR(255) NOT NULL,
              adresse TEXT,
              telephone VARCHAR(50),
              email VARCHAR(100),
              nif VARCHAR(50),
              rc VARCHAR(50),
              activite TEXT,
              slogan TEXT,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
      ', p_tenant);
  END IF;
  
  -- Insérer ou mettre à jour (UPSERT)
  EXECUTE format('
      INSERT INTO %I.activite (nom_entreprise, adresse, telephone, email, nif, rc, activite, slogan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
          nom_entreprise = EXCLUDED.nom_entreprise,
          adresse = EXCLUDED.adresse,
          telephone = EXCLUDED.telephone,
          email = EXCLUDED.email,
          nif = EXCLUDED.nif,
          rc = EXCLUDED.rc,
          activite = EXCLUDED.activite,
          slogan = EXCLUDED.slogan
      RETURNING id
  ', p_tenant) 
  USING p_nom_entreprise, p_adresse, p_telephone, p_email, p_nif, p_rc, p_activite, p_slogan
  INTO new_id;
  
  RETURN COALESCE(new_id, 1);
  
EXCEPTION
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Error in insert_activity_to_tenant: %', SQLERRM;
END;
$function$;

-- 3. Mettre à jour une activité (VERSION CORRIGÉE)
CREATE OR REPLACE FUNCTION update_activity_in_tenant(
  p_tenant TEXT,
  p_activity_id INTEGER,
  p_nom_entreprise TEXT,
  p_adresse TEXT DEFAULT '',
  p_telephone TEXT DEFAULT '',
  p_email TEXT DEFAULT '',
  p_nif TEXT DEFAULT '',
  p_rc TEXT DEFAULT '',
  p_activite TEXT DEFAULT '',
  p_slogan TEXT DEFAULT ''
)
RETURNS BOOLEAN
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
  rows_affected INTEGER;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RAISE EXCEPTION 'Schema % does not exist', p_tenant;
  END IF;
  
  -- Vérifier si la table activite existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'activite'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RAISE EXCEPTION 'Table activite does not exist in schema %', p_tenant;
  END IF;
  
  -- Mettre à jour l'activité (ou insérer si n'existe pas)
  EXECUTE format('
      INSERT INTO %I.activite (id, nom_entreprise, adresse, telephone, email, nif, rc, activite, slogan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
          nom_entreprise = EXCLUDED.nom_entreprise,
          adresse = EXCLUDED.adresse,
          telephone = EXCLUDED.telephone,
          email = EXCLUDED.email,
          nif = EXCLUDED.nif,
          rc = EXCLUDED.rc,
          activite = EXCLUDED.activite,
          slogan = EXCLUDED.slogan
  ', p_tenant) 
  USING p_activity_id, p_nom_entreprise, p_adresse, p_telephone, p_email, p_nif, p_rc, p_activite, p_slogan;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Error in update_activity_in_tenant: %', SQLERRM;
END;
$function$;

-- 4. Supprimer une activité (VERSION CORRIGÉE)
CREATE OR REPLACE FUNCTION delete_activity_from_tenant(
  p_tenant TEXT,
  p_activity_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
  rows_affected INTEGER;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RAISE EXCEPTION 'Schema % does not exist', p_tenant;
  END IF;
  
  -- Vérifier si la table activite existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'activite'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RAISE EXCEPTION 'Table activite does not exist in schema %', p_tenant;
  END IF;
  
  -- Supprimer l'activité
  EXECUTE format('
      DELETE FROM %I.activite WHERE id = $1
  ', p_tenant) 
  USING p_activity_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Error in delete_activity_from_tenant: %', SQLERRM;
END;
$function$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_activities_by_tenant TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_activity_to_tenant TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_activity_in_tenant TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_activity_from_tenant TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_activities_by_tenant IS 'Récupère toutes les activités d''un tenant (version corrigée)';
COMMENT ON FUNCTION insert_activity_to_tenant IS 'Insère une nouvelle activité dans un tenant (version corrigée)';
COMMENT ON FUNCTION update_activity_in_tenant IS 'Met à jour une activité existante (version corrigée)';
COMMENT ON FUNCTION delete_activity_from_tenant IS 'Supprime une activité d''un tenant (version corrigée)';