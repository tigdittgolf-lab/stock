-- =====================================================
-- FONCTIONS RPC POUR GESTION DE LA TABLE ACTIVITE
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS get_activities_by_tenant(text);
DROP FUNCTION IF EXISTS insert_activity_to_tenant(text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS update_activity_in_tenant(text,integer,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS delete_activity_from_tenant(text,integer);

-- 1. Récupérer toutes les activités d'un tenant
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
      
      -- Insérer une activité par défaut
      EXECUTE format('
          INSERT INTO %I.activite (nom_entreprise, adresse, activite)
          VALUES (''Mon Entreprise'', ''Adresse de l''''entreprise'', ''Activité principale'')
      ', p_tenant);
  END IF;
  
  -- Retourner toutes les activités
  RETURN QUERY EXECUTE format('
      SELECT a.id, a.nom_entreprise, a.adresse, a.telephone, a.email, 
             a.nif, a.rc, a.activite, a.slogan, a.created_at
      FROM %I.activite a
      ORDER BY a.id
  ', p_tenant);
  
EXCEPTION
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Error in get_activities_by_tenant: %', SQLERRM;
END;
$function$;

-- 2. Insérer une nouvelle activité
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
  
  -- Insérer la nouvelle activité
  EXECUTE format('
      INSERT INTO %I.activite (nom_entreprise, adresse, telephone, email, nif, rc, activite, slogan)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id
  ', p_tenant) 
  USING p_nom_entreprise, p_adresse, p_telephone, p_email, p_nif, p_rc, p_activite, p_slogan
  INTO new_id;
  
  RETURN new_id;
  
EXCEPTION
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Error in insert_activity_to_tenant: %', SQLERRM;
END;
$function$;

-- 3. Mettre à jour une activité
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
  
  -- Mettre à jour l'activité
  EXECUTE format('
      UPDATE %I.activite 
      SET nom_entreprise = $1, adresse = $2, telephone = $3, email = $4,
          nif = $5, rc = $6, activite = $7, slogan = $8
      WHERE id = $9
  ', p_tenant) 
  USING p_nom_entreprise, p_adresse, p_telephone, p_email, p_nif, p_rc, p_activite, p_slogan, p_activity_id;
  
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  
  IF rows_affected = 0 THEN
      RAISE EXCEPTION 'Activity with id % not found', p_activity_id;
  END IF;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
      RAISE EXCEPTION 'Error in update_activity_in_tenant: %', SQLERRM;
END;
$function$;

-- 4. Supprimer une activité
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
  
  IF rows_affected = 0 THEN
      RAISE EXCEPTION 'Activity with id % not found', p_activity_id;
  END IF;
  
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
COMMENT ON FUNCTION get_activities_by_tenant IS 'Récupère toutes les activités d''un tenant';
COMMENT ON FUNCTION insert_activity_to_tenant IS 'Insère une nouvelle activité dans un tenant';
COMMENT ON FUNCTION update_activity_in_tenant IS 'Met à jour une activité existante';
COMMENT ON FUNCTION delete_activity_from_tenant IS 'Supprime une activité d''un tenant';

-- Tests des fonctions (optionnel)
-- SELECT * FROM get_activities_by_tenant('2025_bu01');
-- SELECT insert_activity_to_tenant('2025_bu01', 'Test Entreprise', 'Adresse test', '0123456789');