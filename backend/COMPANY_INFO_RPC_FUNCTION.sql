-- Fonction RPC pour récupérer les informations de l'entreprise depuis la table activite
-- Cette fonction accède au schéma tenant spécifié pour récupérer les données de l'entreprise

CREATE OR REPLACE FUNCTION get_company_info(p_tenant TEXT)
RETURNS TABLE (
  domaine_activite TEXT,
  sous_domaine TEXT,
  raison_sociale TEXT,
  adresse TEXT,
  commune TEXT,
  wilaya TEXT,
  tel_fixe TEXT,
  tel_port TEXT,
  nrc TEXT,
  nis TEXT,
  nart TEXT,
  ident_fiscal TEXT,
  banq TEXT,
  e_mail TEXT,
  nif TEXT,
  rc TEXT
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Exécuter la requête dynamiquement pour le schéma tenant spécifié
  RETURN QUERY EXECUTE format('
    SELECT 
      a.domaine_activite::TEXT,
      a.sous_domaine::TEXT,
      a.raison_sociale::TEXT,
      a.adresse::TEXT,
      a.commune::TEXT,
      a.wilaya::TEXT,
      a.tel_fixe::TEXT,
      a.tel_port::TEXT,
      a.nrc::TEXT,
      a.nis::TEXT,
      a.nart::TEXT,
      a.ident_fiscal::TEXT,
      a.banq::TEXT,
      a.e_mail::TEXT,
      a.nif::TEXT,
      a.rc::TEXT
    FROM %I.activite a
    ORDER BY a.created_at DESC
    LIMIT 1
  ', p_tenant);
END;
$$;

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_company_info(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_company_info(TEXT) TO anon;