-- Fonctions RPC simplifiées pour les factures avec fallback
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Fonction pour obtenir le prochain numéro de facture (avec fallback)
CREATE OR REPLACE FUNCTION get_next_invoice_number_simple(p_tenant TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    next_number INTEGER;
    schema_exists BOOLEAN;
    table_exists BOOLEAN;
BEGIN
    -- Vérifier si le schéma existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = p_tenant
    ) INTO schema_exists;
    
    IF NOT schema_exists THEN
        RETURN 1;
    END IF;
    
    -- Vérifier si la table fact existe
    SELECT EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = p_tenant AND table_name = 'fact'
    ) INTO table_exists;
    
    IF NOT table_exists THEN
        RETURN 1;
    END IF;
    
    -- Obtenir le prochain numéro de facture
    EXECUTE format('
        SELECT COALESCE(MAX(nfact), 0) + 1 
        FROM %I.fact
    ', p_tenant) INTO next_number;
    
    -- Si aucune facture n'existe, commencer à 1
    RETURN COALESCE(next_number, 1);
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner 1
        RETURN 1;
END;
$$;

-- 2. Fonction pour créer le schéma et les tables si nécessaires
CREATE OR REPLACE FUNCTION ensure_invoice_schema(p_tenant TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Créer le schéma s'il n'existe pas
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_tenant);
    
    -- Créer la table fact s'elle n'existe pas
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.fact (
            nfact SERIAL PRIMARY KEY,
            nclient VARCHAR(20),
            date_fact DATE,
            montant_ht DECIMAL(15,2) DEFAULT 0,
            timbre DECIMAL(15,2) DEFAULT 0,
            tva DECIMAL(15,2) DEFAULT 0,
            autre_taxe DECIMAL(15,2) DEFAULT 0,
            marge DECIMAL(15,2) DEFAULT 0,
            banq VARCHAR(100),
            ncheque VARCHAR(50),
            nbc VARCHAR(50),
            date_bc DATE,
            nom_preneur VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ', p_tenant);
    
    -- Créer la table detail_fact s'elle n'existe pas
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.detail_fact (
            id SERIAL PRIMARY KEY,
            nfact INTEGER,
            narticle VARCHAR(20),
            qte DECIMAL(15,2),
            prix DECIMAL(15,2),
            tva DECIMAL(15,2),
            pr_achat DECIMAL(15,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ', p_tenant);
    
    RETURN TRUE;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- 3. Fonction pour insérer une facture (avec création automatique des tables)
CREATE OR REPLACE FUNCTION insert_fact_safe(
  p_tenant TEXT,
  p_nclient VARCHAR(20),
  p_date_fact DATE,
  p_montant_ht NUMERIC(15,2),
  p_tva NUMERIC(15,2)
) RETURNS JSON AS $$
DECLARE
  result JSON;
  next_number INTEGER;
BEGIN
  -- S'assurer que le schéma et les tables existent
  PERFORM ensure_invoice_schema(p_tenant);
  
  -- Obtenir le prochain numéro
  SELECT get_next_invoice_number_simple(p_tenant) INTO next_number;
  
  -- Insérer la facture
  EXECUTE format('
    INSERT INTO %I.fact (nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, marge, banq, ncheque, nbc, nom_preneur) 
    VALUES ($1, $2, $3, $4, $5, 0, 0, 0, '''', '''', '''', '''') 
    RETURNING row_to_json(fact.*)
  ', p_tenant)
  USING next_number, p_nclient, p_date_fact, p_montant_ht, p_tva
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour insérer un détail de facture
CREATE OR REPLACE FUNCTION insert_detail_fact_safe(
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
  -- S'assurer que le schéma et les tables existent
  PERFORM ensure_invoice_schema(p_tenant);
  
  -- Insérer le détail
  EXECUTE format('
    INSERT INTO %I.detail_fact (nfact, narticle, qte, prix, tva, pr_achat) 
    VALUES ($1, $2, $3, $4, $5, $6) 
    RETURNING row_to_json(detail_fact.*)
  ', p_tenant)
  USING p_nfact, p_narticle, p_qte, p_prix, p_tva, p_pr_achat
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_next_invoice_number_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ensure_invoice_schema TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_fact_safe TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_fact_safe TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_next_invoice_number_simple IS 'Obtient le prochain numéro de facture avec fallback';
COMMENT ON FUNCTION ensure_invoice_schema IS 'Crée le schéma et les tables de factures si nécessaires';
COMMENT ON FUNCTION insert_fact_safe IS 'Insère une facture avec création automatique des tables';
COMMENT ON FUNCTION insert_detail_fact_safe IS 'Insère un détail de facture avec création automatique des tables';

-- 5. Fonction pour récupérer la liste des factures
CREATE OR REPLACE FUNCTION get_fact_list(p_tenant TEXT) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Vérifier si la table fact existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Récupérer les factures
  EXECUTE format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM %I.fact ORDER BY nfact DESC) t', p_tenant) INTO result;
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Fonction pour récupérer une facture par ID
CREATE OR REPLACE FUNCTION get_fact_by_id(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN NULL;
  END IF;
  
  -- Vérifier si la table fact existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer la facture
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I.fact WHERE nfact = $1) t', p_tenant) 
  USING p_nfact INTO result;
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions pour les nouvelles fonctions
GRANT EXECUTE ON FUNCTION get_fact_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_by_id TO anon, authenticated;

-- Commentaires pour les nouvelles fonctions
COMMENT ON FUNCTION get_fact_list IS 'Récupère la liste des factures pour un tenant avec vérifications';
COMMENT ON FUNCTION get_fact_by_id IS 'Récupère une facture par ID pour un tenant avec vérifications';