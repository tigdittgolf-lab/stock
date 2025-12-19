-- Corriger la fonction get_tenant_activite pour retourner sous_domaine
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
        telephone,
        email,
        nif,
        rc,
        sous_domaine as activite,
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

-- Test
SELECT get_tenant_activite('2025_bu01');