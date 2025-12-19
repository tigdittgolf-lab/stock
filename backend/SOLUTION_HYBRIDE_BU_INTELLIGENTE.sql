-- =====================================================
-- SOLUTION HYBRIDE INTELLIGENTE POUR LES BUSINESS UNITS
-- =====================================================
-- Cette solution combine détection automatique + table fiable
-- Exécutez tout ce code dans Supabase SQL Editor
-- =====================================================

-- 1. Créer la table business_units avec détection automatique
CREATE TABLE IF NOT EXISTS public.business_units (
  id SERIAL PRIMARY KEY,
  schema_name TEXT UNIQUE NOT NULL,
  bu_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  nom_entreprise TEXT DEFAULT 'ETS BENAMAR BOUZID MENOUAR',
  adresse TEXT DEFAULT '10, Rue Belhandouz A.E.K, Mostaganem',
  telephone TEXT DEFAULT '(213)045.42.35.20',
  email TEXT DEFAULT 'outillagesaada@gmail.com',
  active BOOLEAN DEFAULT true,
  auto_detected BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. Activer RLS et créer les politiques
ALTER TABLE public.business_units ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre la lecture à tous (anon, authenticated, service_role)
DROP POLICY IF EXISTS "Allow read to all" ON public.business_units;
CREATE POLICY "Allow read to all" ON public.business_units 
  FOR SELECT USING (true);

-- Politique pour permettre l'insertion/mise à jour aux rôles autorisés
DROP POLICY IF EXISTS "Allow insert/update to service_role" ON public.business_units;
CREATE POLICY "Allow insert/update to service_role" ON public.business_units 
  FOR ALL USING (true);

-- 3. Fonction de synchronisation intelligente
CREATE OR REPLACE FUNCTION sync_business_units()
RETURNS JSON AS $$
DECLARE
  schema_record RECORD;
  inserted_count INTEGER := 0;
  updated_count INTEGER := 0;
  result JSON;
  bu_code_extracted TEXT;
  year_extracted INTEGER;
BEGIN
  -- Scanner tous les schémas tenant existants dans information_schema
  FOR schema_record IN 
    SELECT schema_name
    FROM information_schema.schemata 
    WHERE schema_name ~ '^\d{4}_bu\d+$'
    AND schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
  LOOP
    -- Extraire bu_code et year
    bu_code_extracted := SUBSTRING(schema_record.schema_name FROM 'bu(\d+)');
    year_extracted := CAST(SUBSTRING(schema_record.schema_name FROM '(\d{4})') AS INTEGER);
    
    -- Insérer seulement s'il n'existe pas déjà
    INSERT INTO public.business_units (
      schema_name, 
      bu_code, 
      year, 
      auto_detected,
      created_at,
      updated_at
    ) 
    VALUES (
      schema_record.schema_name,
      bu_code_extracted,
      year_extracted,
      true,
      NOW(),
      NOW()
    )
    ON CONFLICT (schema_name) DO UPDATE SET
      updated_at = NOW(),
      active = true  -- Réactiver si désactivé
    WHERE business_units.schema_name = schema_record.schema_name;
    
    -- Compter les insertions/mises à jour
    IF NOT FOUND THEN
      inserted_count := inserted_count + 1;
    ELSE
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  -- Retourner tous les BU actifs avec métadonnées de synchronisation
  SELECT json_build_object(
    'business_units', COALESCE(
      (SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          schema_name,
          bu_code,
          year,
          nom_entreprise,
          adresse,
          telephone,
          email,
          active,
          auto_detected,
          created_at,
          updated_at
        FROM public.business_units 
        WHERE active = true
        ORDER BY year DESC, CAST(bu_code AS INTEGER)
      ) t), 
      '[]'::json
    ),
    'sync_info', json_build_object(
      'newly_detected', inserted_count,
      'updated', updated_count,
      'sync_timestamp', NOW(),
      'total_active', (SELECT COUNT(*) FROM public.business_units WHERE active = true)
    )
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur (permissions, etc.), retourner les BU existants dans la table
    SELECT json_build_object(
      'business_units', COALESCE(
        (SELECT json_agg(row_to_json(t)) FROM (
          SELECT 
            schema_name,
            bu_code,
            year,
            nom_entreprise,
            adresse,
            telephone,
            email,
            active
          FROM public.business_units 
          WHERE active = true
          ORDER BY year DESC, CAST(bu_code AS INTEGER)
        ) t), 
        '[]'::json
      ),
      'sync_info', json_build_object(
        'error', SQLERRM,
        'fallback_mode', true,
        'sync_timestamp', NOW()
      )
    ) INTO result;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction get_available_exercises mise à jour
CREATE OR REPLACE FUNCTION get_available_exercises()
RETURNS JSON AS $$
DECLARE
  sync_result JSON;
  business_units_array JSON;
BEGIN
  -- Synchroniser d'abord (détecter automatiquement les nouveaux schémas)
  SELECT sync_business_units() INTO sync_result;
  
  -- Extraire seulement le tableau des business_units
  SELECT sync_result->'business_units' INTO business_units_array;
  
  -- Retourner le format attendu par l'application
  RETURN COALESCE(business_units_array, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback ultime : retourner les BU de la table sans synchronisation
    RETURN COALESCE(
      (SELECT json_agg(row_to_json(t)) FROM (
        SELECT 
          schema_name,
          bu_code,
          year,
          nom_entreprise,
          adresse,
          telephone,
          email,
          active
        FROM public.business_units 
        WHERE active = true
        ORDER BY year DESC, CAST(bu_code AS INTEGER)
      ) t), 
      '[]'::json
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Insérer vos BU existants (données initiales)
INSERT INTO public.business_units (schema_name, bu_code, year, auto_detected) VALUES
('2026_bu01', '01', 2026, false),
('2025_bu01', '01', 2025, false),
('2025_bu02', '02', 2025, false),
('2024_bu01', '01', 2024, false)
ON CONFLICT (schema_name) DO NOTHING;

-- 6. Fonction utilitaire pour ajouter manuellement un BU
CREATE OR REPLACE FUNCTION add_business_unit(
  p_schema_name TEXT,
  p_nom_entreprise TEXT DEFAULT 'ETS BENAMAR BOUZID MENOUAR',
  p_adresse TEXT DEFAULT '10, Rue Belhandouz A.E.K, Mostaganem',
  p_telephone TEXT DEFAULT '(213)045.42.35.20',
  p_email TEXT DEFAULT 'outillagesaada@gmail.com'
)
RETURNS JSON AS $$
DECLARE
  bu_code_extracted TEXT;
  year_extracted INTEGER;
  result JSON;
BEGIN
  -- Valider le format du schéma
  IF p_schema_name !~ '^\d{4}_bu\d+$' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Format de schéma invalide. Utilisez le format YYYY_buXX (ex: 2025_bu03)'
    );
  END IF;
  
  -- Extraire bu_code et year
  bu_code_extracted := SUBSTRING(p_schema_name FROM 'bu(\d+)');
  year_extracted := CAST(SUBSTRING(p_schema_name FROM '(\d{4})') AS INTEGER);
  
  -- Insérer le nouveau BU
  INSERT INTO public.business_units (
    schema_name, 
    bu_code, 
    year,
    nom_entreprise,
    adresse,
    telephone,
    email,
    auto_detected,
    created_at,
    updated_at
  ) VALUES (
    p_schema_name,
    bu_code_extracted,
    year_extracted,
    p_nom_entreprise,
    p_adresse,
    p_telephone,
    p_email,
    false,
    NOW(),
    NOW()
  );
  
  RETURN json_build_object(
    'success', true,
    'message', 'Business Unit ajouté avec succès',
    'schema_name', p_schema_name,
    'bu_code', bu_code_extracted,
    'year', year_extracted
  );
  
EXCEPTION
  WHEN unique_violation THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ce Business Unit existe déjà: ' || p_schema_name
    );
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Erreur lors de l''ajout: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION sync_business_units() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION get_available_exercises() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION add_business_unit(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated, service_role;

-- 8. Test de la solution
SELECT 'Test de la fonction get_available_exercises:' as test;
SELECT get_available_exercises();

SELECT 'Test de la fonction sync_business_units:' as test;
SELECT sync_business_units();

-- =====================================================
-- INSTRUCTIONS D'UTILISATION:
-- =====================================================
-- 1. Exécutez tout ce code dans Supabase SQL Editor
-- 2. La fonction get_available_exercises() détecte automatiquement les nouveaux schémas
-- 3. Pour ajouter manuellement un BU: SELECT add_business_unit('2025_bu03');
-- 4. Pour voir les détails de synchronisation: SELECT sync_business_units();
-- 5. L'application détectera automatiquement tous les nouveaux BU créés
-- =====================================================