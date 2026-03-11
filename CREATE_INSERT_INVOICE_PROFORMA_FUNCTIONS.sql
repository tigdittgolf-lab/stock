-- Fonctions RPC pour insérer des factures et proformas dans Supabase

-- Supprimer les anciennes versions avec les signatures exactes
DROP FUNCTION IF EXISTS insert_fact_safe(TEXT, CHARACTER VARYING, DATE, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS insert_detail_fact_safe(TEXT, INTEGER, CHARACTER VARYING, NUMERIC, NUMERIC, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS update_stock_facture(TEXT, TEXT, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS insert_proforma_simple(TEXT, INTEGER, TEXT, DATE, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS insert_detail_proforma_simple(TEXT, INTEGER, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC) CASCADE;

-- ============================================
-- FONCTIONS POUR LES FACTURES
-- ============================================

-- 1. Fonction pour insérer une facture
CREATE OR REPLACE FUNCTION insert_fact_safe(
  p_tenant TEXT,
  p_nclient TEXT,
  p_date_fact DATE,
  p_montant_ht NUMERIC,
  p_tva NUMERIC
)
RETURNS TABLE(nfact INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_nfact INTEGER;
  sql_query TEXT;
BEGIN
  -- Obtenir le prochain numéro de facture
  sql_query := format('SELECT COALESCE(MAX("NFact"), 0) + 1 FROM %I.fact', p_tenant);
  EXECUTE sql_query INTO v_nfact;
  
  -- Insérer la facture
  sql_query := format('
    INSERT INTO %I.fact (
      "NFact", "Nclient", date_fact, montant_ht, "TVA", timbre, autre_taxe,
      banq, ncheque
    ) VALUES (
      %s, %L, %L, %s, %s, 0, 0,
      '''', ''''
    )',
    p_tenant, v_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva
  );
  
  EXECUTE sql_query;
  
  RETURN QUERY SELECT v_nfact;
END;
$$;

-- 2. Fonction pour insérer un détail de facture
CREATE OR REPLACE FUNCTION insert_detail_fact_safe(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle TEXT,
  p_qte NUMERIC,
  p_prix NUMERIC,
  p_tva NUMERIC,
  p_pr_achat NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  v_total_ligne NUMERIC;
BEGIN
  v_total_ligne := p_qte * p_prix;
  
  -- Note: detail_fact a des colonnes en VARCHAR, on convertit en texte
  sql_query := format('
    INSERT INTO %I.detail_fact (
      "NFact", "Narticle", "Qte", prix, tva, total_ligne
    ) VALUES (
      %L, %L, %L, %L, %L, %L
    )',
    p_tenant, p_nfact::TEXT, p_narticle, p_qte::TEXT, p_prix::TEXT, p_tva::TEXT, v_total_ligne::TEXT
  );
  
  EXECUTE sql_query;
  
  RETURN format('Détail facture ajouté: article %s, qte %s', p_narticle, p_qte);
END;
$$;

-- 3. Fonction pour mettre à jour le stock facture
CREATE OR REPLACE FUNCTION update_stock_facture(
  p_tenant TEXT,
  p_narticle TEXT,
  p_quantity NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  sql_query := format('
    UPDATE %I.article 
    SET stock_f = stock_f - %s 
    WHERE "Narticle" = %L',
    p_tenant, p_quantity, p_narticle
  );
  
  EXECUTE sql_query;
  
  RETURN format('Stock facture mis à jour pour article %s: -%s', p_narticle, p_quantity);
END;
$$;

-- ============================================
-- FONCTIONS POUR LES PROFORMAS
-- ============================================

-- 4. Fonction pour insérer une proforma
CREATE OR REPLACE FUNCTION insert_proforma_simple(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_nclient TEXT,
  p_date_fact DATE,
  p_montant_ht NUMERIC,
  p_tva NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  sql_query := format('
    INSERT INTO %I.fprof (
      "NFact", "Nclient", date_fact, montant_ht, "TVA", timbre, autre_taxe,
      banq, ncheque
    ) VALUES (
      %s, %L, %L, %s, %s, 0, 0,
      '''', ''''
    )',
    p_tenant, p_nfact, p_nclient, p_date_fact::TEXT, p_montant_ht, p_tva
  );
  
  EXECUTE sql_query;
  
  RETURN format('Proforma %s créée avec succès pour client %s', p_nfact, p_nclient);
END;
$$;

-- 5. Fonction pour insérer un détail de proforma
CREATE OR REPLACE FUNCTION insert_detail_proforma_simple(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle TEXT,
  p_qte NUMERIC,
  p_prix NUMERIC,
  p_tva NUMERIC,
  p_total_ligne NUMERIC
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
BEGIN
  sql_query := format('
    INSERT INTO %I.detail_fprof (
      "NFact", "Narticle", "Qte", prix, tva, total_ligne
    ) VALUES (
      %s, %L, %s, %s, %s, %s
    )',
    p_tenant, p_nfact, p_narticle, p_qte::INTEGER, p_prix::INTEGER, p_tva::INTEGER, p_total_ligne::INTEGER
  );
  
  EXECUTE sql_query;
  
  RETURN format('Détail proforma ajouté: article %s, qte %s', p_narticle, p_qte);
END;
$$;

-- ============================================
-- PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION insert_fact_safe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_fact_safe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_facture TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_proforma_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_proforma_simple TO anon, authenticated;
