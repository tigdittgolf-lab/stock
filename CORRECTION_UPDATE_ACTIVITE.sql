-- Supprimer toutes les versions existantes de la fonction
DROP FUNCTION IF EXISTS update_tenant_activite(text, json);
DROP FUNCTION IF EXISTS update_tenant_activite(text, jsonb);
DROP FUNCTION IF EXISTS update_tenant_activite(text);

-- Créer la nouvelle fonction update_tenant_activite
CREATE OR REPLACE FUNCTION update_tenant_activite(p_tenant TEXT, p_data JSON)
RETURNS JSON AS $$
DECLARE
  query_text TEXT;
  affected_rows INTEGER;
BEGIN
  -- Mettre à jour la table activite
  query_text := format('
    UPDATE %I.activite 
    SET 
      adresse = $1,
      telephone = $2,
      email = $3,
      sous_domaine = $4,
      slogan = $5
    WHERE true
  ', p_tenant);
  
  EXECUTE query_text USING 
    p_data->>'adresse',
    p_data->>'telephone', 
    p_data->>'email',
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

-- Vérifier le contenu actuel de la table activite
SELECT 'Contenu actuel table activite:' as info;
SELECT * FROM "2025_bu01".activite LIMIT 1;

-- Test de la fonction avec cast explicite
SELECT 'Test update_tenant_activite:' as test;
SELECT update_tenant_activite('2025_bu01'::TEXT, '{"adresse":"Test adresse","telephone":"Test tel","email":"test@test.com","activite":"Test activité","slogan":"Test slogan"}'::JSON);