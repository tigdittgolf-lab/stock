-- Fonctions RPC manquantes pour les factures
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Fonction pour obtenir le prochain numéro de facture
CREATE OR REPLACE FUNCTION get_next_invoice_number_simple(p_tenant TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Obtenir le prochain numéro de facture
    EXECUTE format('
        SELECT COALESCE(MAX(nfact), 0) + 1 
        FROM %I.fact
    ', schema_name) INTO next_number;
    
    -- Si aucune facture n'existe, commencer à 1
    IF next_number IS NULL THEN
        next_number := 1;
    END IF;
    
    RETURN next_number;
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur (schéma inexistant, etc.), retourner 1
        RETURN 1;
END;
$$;

-- 2. Fonction pour récupérer la liste des factures
CREATE OR REPLACE FUNCTION get_fact_list(p_tenant TEXT) 
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM %I.fact ORDER BY nfact DESC) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour récupérer une facture par ID
CREATE OR REPLACE FUNCTION get_fact_by_id(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I.fact WHERE nfact = $1) t', p_tenant) 
  USING p_nfact INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour insérer une facture
CREATE OR REPLACE FUNCTION insert_fact(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_nclient VARCHAR(10),
  p_date_fact DATE,
  p_montant_ht NUMERIC(15,2),
  p_tva NUMERIC(15,2),
  p_timbre NUMERIC(15,2),
  p_autre_taxe NUMERIC(15,2),
  p_marge NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.fact (nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, marge, banq, ncheque, nbc, date_bc, nom_preneur) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, '''', '''', '''', NULL, '''') RETURNING *', p_tenant)
  USING p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_timbre, p_autre_taxe, p_marge
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Fonction pour insérer un détail de facture
CREATE OR REPLACE FUNCTION insert_detail_fact(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle VARCHAR(20),
  p_qte NUMERIC(15,2),
  p_prix NUMERIC(15,2),
  p_tva NUMERIC(15,2),
  p_pr_achat NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('INSERT INTO %I.detail_fact (nfact, narticle, qte, prix, tva, pr_achat) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *', p_tenant)
  USING p_nfact, p_narticle, p_qte, p_prix, p_tva, p_pr_achat
  INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_next_invoice_number_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_by_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_fact TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_fact TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_next_invoice_number_simple IS 'Obtient le prochain numéro de facture pour un tenant';
COMMENT ON FUNCTION get_fact_list IS 'Récupère la liste des factures pour un tenant';
COMMENT ON FUNCTION get_fact_by_id IS 'Récupère une facture par ID pour un tenant';
COMMENT ON FUNCTION insert_fact IS 'Insère une nouvelle facture dans le schéma tenant';
COMMENT ON FUNCTION insert_detail_fact IS 'Insère un détail de facture dans le schéma tenant';