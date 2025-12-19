-- =====================================================
-- FIX COMPLET POUR LA DÉTECTION DES BUSINESS UNITS
-- =====================================================
-- Cette fonction détecte automatiquement TOUS les schémas tenant
-- existants dans votre base de données Supabase
-- =====================================================

-- Fonction améliorée pour détecter TOUS les BU existants
CREATE OR REPLACE FUNCTION get_available_exercises()
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_count INTEGER;
BEGIN
  -- Méthode 1: Essayer la table business_units si elle existe
  BEGIN
    SELECT json_agg(row_to_json(t)) INTO result
    FROM (
      SELECT 
        schema_name,
        bu_code,
        year,
        nom_entreprise,
        adresse,
        telephone,
        email,
        active
      FROM business_units 
      WHERE active = true
      ORDER BY year DESC, bu_code
    ) t;
    
    -- Si on a des données de la table business_units, les retourner
    IF result IS NOT NULL AND json_array_length(result) > 0 THEN
      RETURN result;
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- La table business_units n'existe pas, continuer avec la méthode 2
      NULL;
  END;

  -- Méthode 2: Scanner automatiquement TOUS les schémas tenant existants
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      schema_name,
      SUBSTRING(schema_name FROM 'bu(\d+)') as bu_code,
      CAST(SUBSTRING(schema_name FROM '(\d{4})') AS INTEGER) as year,
      'ETS BENAMAR BOUZID MENOUAR' as nom_entreprise,
      '10, Rue Belhandouz A.E.K, Mostaganem' as adresse,
      '(213)045.42.35.20' as telephone,
      'outillagesaada@gmail.com' as email,
      true as active
    FROM information_schema.schemata 
    WHERE schema_name ~ '^\d{4}_bu\d+$'  -- Pattern: YYYY_buXX
    ORDER BY 
      CAST(SUBSTRING(schema_name FROM '(\d{4})') AS INTEGER) DESC,  -- Année décroissante
      SUBSTRING(schema_name FROM 'bu(\d+)')  -- BU croissant
  ) t;
  
  -- Vérifier combien de schémas on a trouvé
  SELECT json_array_length(result) INTO schema_count;
  
  -- Si on a trouvé des schémas, les retourner
  IF result IS NOT NULL AND schema_count > 0 THEN
    RETURN result;
  END IF;

  -- Méthode 3: Fallback - données par défaut seulement si rien n'est trouvé
  result := '[
    {
      "schema_name": "2025_bu01",
      "bu_code": "01", 
      "year": 2025,
      "nom_entreprise": "ETS BENAMAR BOUZID MENOUAR",
      "adresse": "10, Rue Belhandouz A.E.K, Mostaganem",
      "telephone": "(213)045.42.35.20",
      "email": "outillagesaada@gmail.com",
      "active": true
    },
    {
      "schema_name": "2024_bu01",
      "bu_code": "01",
      "year": 2024, 
      "nom_entreprise": "ETS BENAMAR BOUZID MENOUAR",
      "adresse": "10, Rue Belhandouz A.E.K, Mostaganem",
      "telephone": "(213)045.42.35.20",
      "email": "outillagesaada@gmail.com",
      "active": true
    }
  ]'::json;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur totale, retourner au moins les données de base
    RETURN '[
      {
        "schema_name": "2025_bu01",
        "bu_code": "01",
        "year": 2025,
        "nom_entreprise": "ETS BENAMAR BOUZID MENOUAR",
        "adresse": "10, Rue Belhandouz A.E.K, Mostaganem", 
        "telephone": "(213)045.42.35.20",
        "email": "outillagesaada@gmail.com",
        "active": true
      }
    ]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction alternative pour lister directement les schémas
CREATE OR REPLACE FUNCTION get_tenant_schemas()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  -- Scanner TOUS les schémas qui correspondent au pattern tenant
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      schema_name,
      SUBSTRING(schema_name FROM 'bu(\d+)') as bu_code,
      CAST(SUBSTRING(schema_name FROM '(\d{4})') AS INTEGER) as year,
      'ETS BENAMAR BOUZID MENOUAR' as nom_entreprise,
      '10, Rue Belhandouz A.E.K, Mostaganem' as adresse,
      '(213)045.42.35.20' as telephone,
      'outillagesaada@gmail.com' as email,
      true as active,
      -- Vérifier si le schéma contient des tables
      (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = schema_name
      ) as table_count
    FROM information_schema.schemata 
    WHERE schema_name ~ '^\d{4}_bu\d+$'  -- Pattern: YYYY_buXX
    ORDER BY 
      CAST(SUBSTRING(schema_name FROM '(\d{4})') AS INTEGER) DESC,  -- Année décroissante
      CAST(SUBSTRING(schema_name FROM 'bu(\d+)') AS INTEGER)  -- BU croissant
  ) t
  WHERE table_count > 0;  -- Seulement les schémas qui ont des tables
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de diagnostic pour voir TOUS les schémas
CREATE OR REPLACE FUNCTION debug_all_schemas()
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_agg(row_to_json(t)) INTO result
  FROM (
    SELECT 
      schema_name,
      CASE 
        WHEN schema_name ~ '^\d{4}_bu\d+$' THEN 'TENANT_SCHEMA'
        ELSE 'OTHER_SCHEMA'
      END as schema_type,
      (
        SELECT COUNT(*) 
        FROM information_schema.tables 
        WHERE table_schema = schema_name
      ) as table_count
    FROM information_schema.schemata 
    WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    ORDER BY schema_name
  ) t;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- INSTRUCTIONS D'UTILISATION:
-- =====================================================
-- 1. Exécutez ce code dans Supabase SQL Editor
-- 2. Testez avec: SELECT debug_all_schemas(); 
--    (pour voir tous les schémas disponibles)
-- 3. Testez avec: SELECT get_available_exercises();
--    (pour voir les BU détectés automatiquement)
-- 4. Redéployez l'application sur Vercel
-- =====================================================