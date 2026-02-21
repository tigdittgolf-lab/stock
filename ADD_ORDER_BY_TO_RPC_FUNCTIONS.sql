-- Ajouter ORDER BY aux fonctions RPC pour un ordre stable
-- Cela empêchera les enregistrements de changer de place après modification

-- 1. Fix get_clients_by_tenant - Trier par Nclient
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(row_data)
    FROM (
      SELECT jsonb_build_object(
        ''nclient'', t."Nclient",
        ''raison_sociale'', t."Raison_sociale",
        ''adresse'', t.adresse,
        ''contact_person'', t.contact_person,
        ''tel'', t."Tel",
        ''email'', t.email,
        ''c_affaire_fact'', COALESCE(t."C_affaire_fact", 0),
        ''c_affaire_bl'', COALESCE(t."C_affaire_bl", 0),
        ''nrc'', t."NRC",
        ''date_rc'', t."Date_RC",
        ''lieu_rc'', t."Lieu_RC",
        ''i_fiscal'', t."I_Fiscal",
        ''n_article'', t."N_article",
        ''commentaire'', t."Commentaire"
      ) as row_data
      FROM "%s".client t
      ORDER BY t."Nclient"
    ) subquery', p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- 2. Fix get_suppliers_by_tenant - Trier par Nfournisseur
CREATE OR REPLACE FUNCTION get_suppliers_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(row_data)
    FROM (
      SELECT jsonb_build_object(
        ''nfournisseur'', t."Nfournisseur",
        ''nom_fournisseur'', t."Nom_fournisseur",
        ''resp_fournisseur'', t."Resp_fournisseur",
        ''adresse_fourni'', t."Adresse_fourni",
        ''tel'', t."Tel",
        ''tel1'', t.tel1,
        ''tel2'', t.tel2,
        ''email'', t."EMAIL",
        ''caf'', COALESCE(t."CAF", 0),
        ''cabl'', COALESCE(t."CABL", 0),
        ''commentaire'', t.commentaire
      ) as row_data
      FROM "%s".fournisseur t
      ORDER BY t."Nfournisseur"
    ) subquery', p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION
  WHEN OTHERS THEN
    RETURN '[]'::json;
END;
$$;

-- 3. Fix get_articles_by_tenant - Trier par Narticle
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(row_data)
    FROM (
      SELECT jsonb_build_object(
        ''narticle'', t."Narticle",
        ''famille'', t.famille,
        ''designation'', t.designation,
        ''nfournisseur'', t."Nfournisseur",
        ''prix_unitaire'', t.prix_unitaire,
        ''marge'', t.marge,
        ''tva'', t.tva,
        ''prix_vente'', t.prix_vente,
        ''seuil'', t.seuil,
        ''stock_f'', t.stock_f,
        ''stock_bl'', t.stock_bl
      ) as row_data
      FROM "%s".article t
      ORDER BY t."Narticle"
    ) subquery', p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Test
SELECT 'Functions updated with ORDER BY' as status;
