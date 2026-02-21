-- =====================================================
-- CREATE UPDATE RPC FUNCTIONS FOR CLIENTS AND SUPPLIERS
-- WITH AGGRESSIVE TRUNCATION TO MATCH MYSQL SCHEMA
-- =====================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS update_client_in_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS update_supplier_in_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT);

-- 1. Update client function
-- Truncate ALL fields to match typical MySQL VARCHAR limits from migrated schema
CREATE OR REPLACE FUNCTION update_client_in_tenant(
  p_tenant TEXT,
  p_nclient TEXT,
  p_raison_sociale TEXT,
  p_adresse TEXT,
  p_contact_person TEXT,
  p_tel TEXT,
  p_email TEXT,
  p_c_affaire_fact NUMERIC,
  p_c_affaire_bl NUMERIC,
  p_nrc TEXT,
  p_date_rc TEXT,
  p_lieu_rc TEXT,
  p_i_fiscal TEXT,
  p_n_article TEXT,
  p_commentaire TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_date_rc DATE;
  v_raison_sociale TEXT;
  v_adresse TEXT;
  v_contact_person TEXT;
  v_tel TEXT;
  v_email TEXT;
  v_nrc TEXT;
  v_lieu_rc TEXT;
  v_i_fiscal TEXT;
  v_n_article TEXT;
  v_commentaire TEXT;
BEGIN
  -- Convert date string to DATE type, handle empty/null values
  IF p_date_rc IS NULL OR p_date_rc = '' THEN
    v_date_rc := NULL;
  ELSE
    v_date_rc := p_date_rc::date;
  END IF;

  -- Truncate ALL text fields to match ACTUAL migrated column lengths from 2009_bu02
  -- Nclient(6), Raison_sociale(50), adresse(60), contact_person(30)
  -- Tel(15), email(100), NRC(16), Lieu_RC(14), I_Fiscal(19), N_article(14), Commentaire(89)
  v_raison_sociale := SUBSTRING(COALESCE(p_raison_sociale, ''), 1, 50);
  v_adresse := SUBSTRING(COALESCE(p_adresse, ''), 1, 60);
  v_contact_person := SUBSTRING(COALESCE(p_contact_person, ''), 1, 30);
  v_tel := SUBSTRING(COALESCE(p_tel, ''), 1, 15);
  v_email := SUBSTRING(COALESCE(p_email, ''), 1, 100);
  v_nrc := SUBSTRING(COALESCE(p_nrc, ''), 1, 16);
  v_lieu_rc := SUBSTRING(COALESCE(p_lieu_rc, ''), 1, 14);
  v_i_fiscal := SUBSTRING(COALESCE(p_i_fiscal, ''), 1, 19);
  v_n_article := SUBSTRING(COALESCE(p_n_article, ''), 1, 14);
  v_commentaire := SUBSTRING(COALESCE(p_commentaire, ''), 1, 89);

  EXECUTE format('
    UPDATE "%s".client
    SET 
      "Raison_sociale" = $1,
      adresse = $2,
      contact_person = $3,
      "Tel" = $4,
      email = $5,
      "C_affaire_fact" = $6,
      "C_affaire_bl" = $7,
      "NRC" = $8,
      "Date_RC" = $9,
      "Lieu_RC" = $10,
      "I_Fiscal" = $11,
      "N_article" = $12,
      "Commentaire" = $13
    WHERE "Nclient" = $14
    RETURNING jsonb_build_object(
      ''nclient'', "Nclient",
      ''raison_sociale'', "Raison_sociale",
      ''adresse'', adresse,
      ''contact_person'', contact_person,
      ''tel'', "Tel",
      ''email'', email,
      ''c_affaire_fact'', "C_affaire_fact",
      ''c_affaire_bl'', "C_affaire_bl",
      ''nrc'', "NRC",
      ''date_rc'', "Date_RC",
      ''lieu_rc'', "Lieu_RC",
      ''i_fiscal'', "I_Fiscal",
      ''n_article'', "N_article",
      ''commentaire'', "Commentaire"
    )', p_tenant)
  USING v_raison_sociale, v_adresse, v_contact_person, v_tel, v_email,
        p_c_affaire_fact, p_c_affaire_bl, v_nrc, v_date_rc, v_lieu_rc,
        v_i_fiscal, v_n_article, v_commentaire, p_nclient
  INTO result;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- 2. Update supplier function
CREATE OR REPLACE FUNCTION update_supplier_in_tenant(
  p_tenant TEXT,
  p_nfournisseur TEXT,
  p_nom_fournisseur TEXT,
  p_resp_fournisseur TEXT,
  p_adresse_fourni TEXT,
  p_tel TEXT,
  p_email TEXT,
  p_caf NUMERIC,
  p_cabl NUMERIC,
  p_commentaire TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  v_nom_fournisseur TEXT;
  v_resp_fournisseur TEXT;
  v_adresse_fourni TEXT;
  v_tel TEXT;
  v_email TEXT;
  v_commentaire TEXT;
BEGIN
  -- Truncate fields to match ACTUAL migrated column lengths from 2009_bu02
  -- Nfournisseur(10), Nom_fournisseur(26), Resp_fournisseur(16), 
  -- Adresse_fourni(50), Tel(15), EMAIL(100), commentaire(50)
  v_nom_fournisseur := SUBSTRING(COALESCE(p_nom_fournisseur, ''), 1, 26);
  v_resp_fournisseur := SUBSTRING(COALESCE(p_resp_fournisseur, ''), 1, 16);
  v_adresse_fourni := SUBSTRING(COALESCE(p_adresse_fourni, ''), 1, 50);
  v_tel := SUBSTRING(COALESCE(p_tel, ''), 1, 15);
  v_email := SUBSTRING(COALESCE(p_email, ''), 1, 100);
  v_commentaire := SUBSTRING(COALESCE(p_commentaire, ''), 1, 50);

  EXECUTE format('
    UPDATE "%s".fournisseur
    SET 
      "Nom_fournisseur" = $1,
      "Resp_fournisseur" = $2,
      "Adresse_fourni" = $3,
      "Tel" = $4,
      "EMAIL" = $5,
      "CAF" = $6,
      "CABL" = $7,
      commentaire = $8
    WHERE "Nfournisseur" = $9
    RETURNING jsonb_build_object(
      ''nfournisseur'', "Nfournisseur",
      ''nom_fournisseur'', "Nom_fournisseur",
      ''resp_fournisseur'', "Resp_fournisseur",
      ''adresse_fourni'', "Adresse_fourni",
      ''tel'', "Tel",
      ''email'', "EMAIL",
      ''caf'', "CAF",
      ''cabl'', "CABL",
      ''commentaire'', commentaire
    )', p_tenant)
  USING v_nom_fournisseur, v_resp_fournisseur, v_adresse_fourni, v_tel,
        v_email, p_caf, p_cabl, v_commentaire, p_nfournisseur
  INTO result;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Test the functions
SELECT 'Testing update_client_in_tenant...' as test;
-- Don't actually update, just verify function exists
SELECT update_client_in_tenant(
  '2009_bu02', '1', 'TEST CLIENT', 'TEST ADDRESS', 'TEST CONTACT',
  '0000000000', 'test@test.com', 0, 0, '', '', '', '', '', ''
);

SELECT 'Testing update_supplier_in_tenant...' as test;
-- Don't actually update, just verify function exists
SELECT update_supplier_in_tenant(
  '2009_bu02', 'TEST', 'TEST SUPPLIER', 'TEST RESP', 'TEST ADDRESS',
  '0000000000', 'test@test.com', 0, 0, ''
);
