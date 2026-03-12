-- Fonction RPC pour récupérer la dette d'UN SEUL client
-- Utilisée quand on sélectionne un client dans le formulaire
DROP FUNCTION IF EXISTS get_client_debt(TEXT, VARCHAR);

CREATE OR REPLACE FUNCTION get_client_debt(p_tenant TEXT, p_client_code VARCHAR)
RETURNS TABLE(
  nclient VARCHAR,
  raison_sociale VARCHAR,
  adresse VARCHAR,
  tel VARCHAR,
  email VARCHAR,
  c_affaire_fact NUMERIC,
  c_affaire_bl NUMERIC,
  chiffre_affaire NUMERIC,
  total_factures NUMERIC,
  total_bl NUMERIC,
  total_paiements NUMERIC,
  solde NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  sql_query := format('
    WITH client_data AS (
      SELECT 
        c."Nclient",
        c."Raison_sociale",
        c.adresse,
        c."Tel",
        c.email,
        COALESCE(c."C_affaire_fact", 0) as ca_fact,
        COALESCE(c."C_affaire_bl", 0) as ca_bl
      FROM %I.client c
      WHERE c."Nclient" = %L
    ),
    factures_totals AS (
      SELECT 
        f."Nclient",
        COALESCE(SUM(f.montant_ht + f."TVA"), 0) as total_fact
      FROM %I.fact f
      WHERE f."Nclient" = %L
      GROUP BY f."Nclient"
    ),
    bl_totals AS (
      SELECT 
        b."Nclient",
        COALESCE(SUM(b.montant_ht + b."TVA"), 0) as total_bl
      FROM %I.bl b
      WHERE b."Nclient" = %L
      GROUP BY b."Nclient"
    ),
    payments_by_client AS (
      SELECT 
        COALESCE(SUM(p.amount), 0) as total_paid
      FROM public.payments p
      LEFT JOIN %I.fact f ON p.document_type IN (''invoice'', ''facture'') AND p.document_id = f."NFact" AND f."Nclient" = %L
      LEFT JOIN %I.bl b ON p.document_type IN (''delivery_note'', ''bl'') AND p.document_id = b."NFact" AND b."Nclient" = %L
      WHERE p.tenant_id = %L
        AND (
          (p.document_type IN (''invoice'', ''facture'') AND f."Nclient" = %L)
          OR (p.document_type IN (''delivery_note'', ''bl'') AND b."Nclient" = %L)
        )
    )
    SELECT 
      cd."Nclient"::VARCHAR,
      cd."Raison_sociale"::VARCHAR,
      cd.adresse::VARCHAR,
      cd."Tel"::VARCHAR,
      cd.email::VARCHAR,
      cd.ca_fact::NUMERIC,
      cd.ca_bl::NUMERIC,
      (cd.ca_fact + cd.ca_bl)::NUMERIC as total_ca,
      COALESCE(ft.total_fact, 0)::NUMERIC as total_factures,
      COALESCE(bt.total_bl, 0)::NUMERIC as total_bl,
      COALESCE(pbc.total_paid, 0)::NUMERIC as total_paiements,
      (COALESCE(ft.total_fact, 0) + COALESCE(bt.total_bl, 0) - COALESCE(pbc.total_paid, 0))::NUMERIC as dette
    FROM client_data cd
    LEFT JOIN factures_totals ft ON ft."Nclient" = cd."Nclient"
    LEFT JOIN bl_totals bt ON bt."Nclient" = cd."Nclient"
    CROSS JOIN payments_by_client pbc
  ', p_tenant, p_client_code, p_tenant, p_client_code, p_tenant, p_client_code, 
     p_tenant, p_client_code, p_tenant, p_client_code, p_tenant, p_client_code, p_client_code);
  
  RETURN QUERY EXECUTE sql_query;
END;
$$;

-- Donner les permissions
GRANT EXECUTE ON FUNCTION get_client_debt TO anon, authenticated;
