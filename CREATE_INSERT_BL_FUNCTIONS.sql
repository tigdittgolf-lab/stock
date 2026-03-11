-- Fonctions RPC pour insérer des BL et leurs détails dans Supabase
-- Supprimer les anciennes versions si elles existent
DROP FUNCTION IF EXISTS insert_bl_simple(TEXT, INTEGER, TEXT, DATE, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS insert_detail_bl_simple(TEXT, INTEGER, TEXT, NUMERIC, NUMERIC, NUMERIC, NUMERIC);
DROP FUNCTION IF EXISTS update_stock_bl_simple(TEXT, TEXT, NUMERIC);

-- 1. Fonction pour insérer un BL
CREATE OR REPLACE FUNCTION insert_bl_simple(
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
    INSERT INTO %I.bl (
      "NFact", "Nclient", date_fact, montant_ht, "TVA", timbre, autre_taxe, 
      facturer, banq, ncheque, "NBC", date_bc, nom_preneur
    ) VALUES (
      %s, %L, %L, %s, %s, 0, 0,
      0, '''', '''', '''', NULL, ''''
    )',
    p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva
  );
  
  EXECUTE sql_query;
  
  RETURN format('BL %s créé avec succès pour client %s', p_nfact, p_nclient);
END;
$$;

-- 2. Fonction pour insérer un détail de BL
CREATE OR REPLACE FUNCTION insert_detail_bl_simple(
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
    INSERT INTO %I.detail_bl (
      "NFact", "Narticle", "Qte", prix, tva, total_ligne, facturer
    ) VALUES (
      %s, %L, %s, %s, %s, %s, 0
    )',
    p_tenant, p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne
  );
  
  EXECUTE sql_query;
  
  RETURN format('Détail BL ajouté: article %s, qte %s', p_narticle, p_qte);
END;
$$;

-- 3. Fonction pour mettre à jour le stock BL
CREATE OR REPLACE FUNCTION update_stock_bl_simple(
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
    SET stock_bl = stock_bl - %s 
    WHERE "Narticle" = %L',
    p_tenant, p_quantity, p_narticle
  );
  
  EXECUTE sql_query;
  
  RETURN format('Stock BL mis à jour pour article %s: -%s', p_narticle, p_quantity);
END;
$$;

-- 4. Donner les permissions
GRANT EXECUTE ON FUNCTION insert_bl_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_bl_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_bl_simple TO anon, authenticated;
