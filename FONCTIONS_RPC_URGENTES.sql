-- =====================================================
-- FONCTIONS RPC URGENTES POUR PARAMÈTRES
-- =====================================================

-- 1. GET_FAMILIES - Récupérer les familles depuis les articles existants
-- =====================================================
CREATE OR REPLACE FUNCTION get_families(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT json_agg(DISTINCT famille) 
    FROM %I.article 
    WHERE famille IS NOT NULL AND famille != ''''
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  RETURN COALESCE(result, '["Habillement", "Peinture"]'::json);
EXCEPTION
  WHEN OTHERS THEN
    -- Retourner les familles des articles existants
    RETURN '["Habillement", "Peinture"]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. GET_TENANT_ACTIVITE - Récupérer les infos entreprise
-- =====================================================
CREATE OR REPLACE FUNCTION get_tenant_activite(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  -- Essayer de récupérer depuis la table activite
  query_text := format('
    SELECT row_to_json(t) 
    FROM (
      SELECT 
        nom_entreprise,
        adresse,
        telephone,
        email,
        nif,
        rc,
        activite,
        slogan
      FROM %I.activite 
      LIMIT 1
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  
  -- Si pas de données, retourner les infos par défaut
  IF result IS NULL THEN
    result := json_build_object(
      'nom_entreprise', 'ETS BENAMAR BOUZID MENOUAR',
      'adresse', '10, Rue Belhandouz A.E.K, Mostaganem',
      'telephone', '(213)045.42.35.20',
      'email', 'outillagesaada@gmail.com',
      'nif', '',
      'rc', '',
      'activite', 'Commerce et Distribution',
      'slogan', 'Votre partenaire de confiance'
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    -- Retourner les données par défaut en cas d'erreur
    RETURN json_build_object(
      'nom_entreprise', 'ETS BENAMAR BOUZID MENOUAR',
      'adresse', '10, Rue Belhandouz A.E.K, Mostaganem',
      'telephone', '(213)045.42.35.20',
      'email', 'outillagesaada@gmail.com',
      'nif', '',
      'rc', '',
      'activite', 'Commerce et Distribution',
      'slogan', 'Votre partenaire de confiance'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. UPDATE_TENANT_ACTIVITE - Mettre à jour les infos entreprise
-- =====================================================
CREATE OR REPLACE FUNCTION update_tenant_activite(p_tenant TEXT, p_data JSON)
RETURNS JSON AS $$
DECLARE
  query_text TEXT;
BEGIN
  -- Essayer de mettre à jour la table activite
  query_text := format('
    UPDATE %I.activite 
    SET 
      adresse = $1,
      telephone = $2,
      email = $3,
      activite = $4,
      slogan = $5
    WHERE true
  ', p_tenant);
  
  EXECUTE query_text USING 
    p_data->>'adresse',
    p_data->>'telephone', 
    p_data->>'email',
    p_data->>'activite',
    p_data->>'slogan';
  
  RETURN json_build_object('success', true, 'message', 'Informations mises à jour');
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', 'Erreur mise à jour');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TESTS
-- =====================================================
-- SELECT get_families('2025_bu01');
-- SELECT get_tenant_activite('2025_bu01');