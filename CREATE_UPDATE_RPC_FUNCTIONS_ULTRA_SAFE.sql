-- =====================================================
-- ULTRA SAFE VERSION: Truncate EVERYTHING to 10 chars for testing
-- This will help identify which field is causing the issue
-- =====================================================

DROP FUNCTION IF EXISTS update_client_in_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

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
BEGIN
  -- Convert date
  IF p_date_rc IS NULL OR p_date_rc = '' THEN
    v_date_rc := NULL;
  ELSE
    v_date_rc := p_date_rc::date;
  END IF;

  -- ULTRA SAFE: Truncate EVERYTHING to 10 chars for testing
  EXECUTE format('
    UPDATE "%s".client
    SET 
      "Raison_sociale" = SUBSTRING($1, 1, 10),
      adresse = SUBSTRING($2, 1, 10),
      contact_person = SUBSTRING($3, 1, 10),
      "Tel" = SUBSTRING($4, 1, 10),
      email = SUBSTRING($5, 1, 10),
      "C_affaire_fact" = $6,
      "C_affaire_bl" = $7,
      "NRC" = SUBSTRING($8, 1, 10),
      "Date_RC" = $9,
      "Lieu_RC" = SUBSTRING($10, 1, 10),
      "I_Fiscal" = SUBSTRING($11, 1, 10),
      "N_article" = SUBSTRING($12, 1, 10),
      "Commentaire" = SUBSTRING($13, 1, 10)
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
  USING p_raison_sociale, p_adresse, p_contact_person, p_tel, p_email,
        p_c_affaire_fact, p_c_affaire_bl, p_nrc, v_date_rc, p_lieu_rc,
        p_i_fiscal, p_n_article, p_commentaire, p_nclient
  INTO result;
  
  RETURN COALESCE(result, '{}'::json);
END;
$$;

-- Test
SELECT 'Ultra safe version created - all fields truncated to 10 chars in SQL' as status;
