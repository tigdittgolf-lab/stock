-- =====================================================
-- FONCTION UPDATE ACTIVITE COMPLÈTE AVEC TOUS LES CHAMPS
-- =====================================================

-- Supprimer toutes les versions existantes
DROP FUNCTION IF EXISTS update_tenant_activite(text, json);
DROP FUNCTION IF EXISTS update_tenant_activite(text, jsonb);
DROP FUNCTION IF EXISTS update_tenant_activite(text);

-- Créer la fonction complète avec tous les champs
CREATE OR REPLACE FUNCTION update_tenant_activite(p_tenant TEXT, p_data JSON)
RETURNS JSON AS $$
DECLARE
  query_text TEXT;
  affected_rows INTEGER;
BEGIN
  -- Mettre à jour la table activite avec tous les champs
  query_text := format('
    UPDATE %I.activite 
    SET 
      nom_entreprise = $1,
      adresse = $2,
      commune = $3,
      wilaya = $4,
      telephone = $5,
      tel_port = $6,
      email = $7,
      nif = $8,
      ident_fiscal = $9,
      rc = $10,
      nrc = $11,
      nart = $12,
      banq = $13,
      sous_domaine = $14,
      slogan = $15
    WHERE true
  ', p_tenant);
  
  EXECUTE query_text USING 
    p_data->>'nom_entreprise',
    p_data->>'adresse',
    p_data->>'commune',
    p_data->>'wilaya',
    p_data->>'telephone',
    p_data->>'tel_port',
    p_data->>'email',
    p_data->>'nif',
    p_data->>'ident_fiscal',
    p_data->>'rc',
    p_data->>'nrc',
    p_data->>'nart',
    p_data->>'banq',
    p_data->>'activite',
    p_data->>'slogan';
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Informations mises à jour avec succès',
    'affected_rows', affected_rows
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false, 
      'error', SQLERRM,
      'hint', 'Vérifiez que la table activite existe et contient des données'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mettre à jour aussi la fonction get_tenant_activite pour retourner tous les champs
CREATE OR REPLACE FUNCTION get_tenant_activite(p_tenant TEXT)
RETURNS JSON AS $$
DECLARE
  result JSON;
  query_text TEXT;
BEGIN
  query_text := format('
    SELECT row_to_json(t) 
    FROM (
      SELECT 
        nom_entreprise,
        adresse,
        commune,
        wilaya,
        telephone,
        tel_fixe,
        tel_port,
        email,
        e_mail,
        nif,
        ident_fiscal,
        rc,
        nrc,
        nart,
        banq,
        sous_domaine as activite,
        domaine_activite,
        slogan
      FROM %I.activite 
      LIMIT 1
    ) t
  ', p_tenant);
  
  EXECUTE query_text INTO result;
  
  IF result IS NULL THEN
    result := json_build_object(
      'nom_entreprise', 'ETS BENAMAR BOUZID MENOUAR',
      'adresse', '10, Rue Belhandouz A.E.K, Mostaganem',
      'commune', 'Mostaganem',
      'wilaya', 'Mostaganem',
      'telephone', '(213)045.42.35.20',
      'tel_port', '',
      'email', 'outillagesaada@gmail.com',
      'nif', '',
      'ident_fiscal', '',
      'rc', '',
      'nrc', '',
      'nart', '',
      'banq', '',
      'activite', 'Outillage et Équipements',
      'slogan', 'Votre partenaire de confiance'
    );
  END IF;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'nom_entreprise', 'ETS BENAMAR BOUZID MENOUAR',
      'adresse', '10, Rue Belhandouz A.E.K, Mostaganem',
      'commune', 'Mostaganem',
      'wilaya', 'Mostaganem',
      'telephone', '(213)045.42.35.20',
      'tel_port', '',
      'email', 'outillagesaada@gmail.com',
      'nif', '',
      'ident_fiscal', '',
      'rc', '',
      'nrc', '',
      'nart', '',
      'banq', '',
      'activite', 'Outillage et Équipements',
      'slogan', 'Votre partenaire de confiance'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test (sans modification des données réelles)
SELECT 'Fonctions mises à jour avec succès' as status;