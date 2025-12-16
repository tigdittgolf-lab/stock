-- =====================================================
-- FONCTIONS RPC POUR LE SYSTÈME D'ACHATS - VERSION CORRIGÉE
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS insert_purchase_invoice(text,integer,text,date,numeric,numeric);
DROP FUNCTION IF EXISTS insert_purchase_invoice_with_supplier_number(text,integer,text,text,date,numeric,numeric);
DROP FUNCTION IF EXISTS insert_detail_purchase_invoice(text,integer,text,numeric,numeric,numeric,numeric);
DROP FUNCTION IF EXISTS get_next_purchase_invoice_number(text);
DROP FUNCTION IF EXISTS get_next_purchase_invoice_id(text);
DROP FUNCTION IF EXISTS check_supplier_invoice_exists(text,text,text);
DROP FUNCTION IF EXISTS update_stock_purchase_invoice(text,text,numeric);
DROP FUNCTION IF EXISTS get_purchase_invoices_list(text);
DROP FUNCTION IF EXISTS get_purchase_invoice_with_details(text,integer);
DROP FUNCTION IF EXISTS ensure_purchase_schema(text);

-- 1. Fonction pour créer le schéma et les tables d'achats si nécessaires
CREATE OR REPLACE FUNCTION ensure_purchase_schema(p_tenant TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Créer le schéma s'il n'existe pas
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_tenant);
  
  -- Créer la table facture_achat s'elle n'existe pas
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.facture_achat (
          nfact_achat SERIAL PRIMARY KEY,
          nfournisseur VARCHAR(20),
          numero_facture_fournisseur VARCHAR(100),
          date_fact DATE,
          montant_ht DECIMAL(15,2) DEFAULT 0,
          timbre DECIMAL(15,2) DEFAULT 0,
          tva DECIMAL(15,2) DEFAULT 0,
          autre_taxe DECIMAL(15,2) DEFAULT 0,
          payer BOOLEAN DEFAULT false,
          banq VARCHAR(100),
          ncheque VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
  ', p_tenant);
  
  -- Créer la table detail_facture_achat s'elle n'existe pas
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.detail_facture_achat (
          id SERIAL PRIMARY KEY,
          nfact_achat INTEGER,
          narticle VARCHAR(20),
          qte DECIMAL(15,2),
          prix DECIMAL(15,2),
          tva DECIMAL(15,2),
          total_ligne DECIMAL(15,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
  ', p_tenant);
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN FALSE;
END;
$function$;

-- 2. Fonction pour obtenir le prochain ID interne de facture d'achat
CREATE OR REPLACE FUNCTION get_next_purchase_invoice_id(p_tenant TEXT)
RETURNS INTEGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  next_id INTEGER;
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
  
  -- Vérifier si la table facture_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'facture_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN 1;
  END IF;
  
  -- Obtenir le prochain ID interne
  EXECUTE format('
      SELECT COALESCE(MAX(nfact_achat), 0) + 1 
      FROM %I.facture_achat
  ', p_tenant) INTO next_id;
  
  RETURN COALESCE(next_id, 1);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN 1;
END;
$function$;

-- 3. Fonction pour vérifier si un numéro de facture fournisseur existe déjà
CREATE OR REPLACE FUNCTION check_supplier_invoice_exists(
  p_tenant TEXT,
  p_nfournisseur TEXT,
  p_numero_facture TEXT
) RETURNS JSON
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
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
  
  -- Vérifier si la table facture_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'facture_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Chercher une facture existante avec ce numéro fournisseur
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nfact_achat'', nfact_achat,
        ''numero_facture_fournisseur'', numero_facture_fournisseur
      )
    ) 
    FROM %I.facture_achat 
    WHERE nfournisseur = $1 AND numero_facture_fournisseur = $2
  ', p_tenant) 
  USING p_nfournisseur, p_numero_facture INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$function$;

-- 4. Fonction pour créer une facture d'achat avec numéro fournisseur
CREATE OR REPLACE FUNCTION insert_purchase_invoice_with_supplier_number(
  p_tenant TEXT,
  p_nfact_achat INTEGER,
  p_nfournisseur TEXT,
  p_numero_facture_fournisseur TEXT,
  p_date_fact DATE,
  p_montant_ht NUMERIC,
  p_tva NUMERIC
) RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  -- S'assurer que le schéma et les tables existent
  PERFORM ensure_purchase_schema(p_tenant);
  
  -- Insérer la facture d'achat avec le numéro fournisseur
  EXECUTE format('
    INSERT INTO %I.facture_achat (
      nfact_achat, nfournisseur, numero_facture_fournisseur, date_fact, montant_ht, tva, 
      timbre, autre_taxe, payer, banq, ncheque, created_at, updated_at
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, 0, 0, false, '''', '''', NOW(), NOW())
  ', p_tenant)
  USING p_nfact_achat, p_nfournisseur, p_numero_facture_fournisseur, p_date_fact, p_montant_ht, p_tva;
  
  RETURN format('Facture d''achat %s (%s) créée avec succès', p_numero_facture_fournisseur, p_nfact_achat);
END;
$function$;

-- 5. Fonction pour insérer un détail de facture d'achat
CREATE OR REPLACE FUNCTION insert_detail_purchase_invoice(
  p_tenant TEXT,
  p_nfact_achat INTEGER,
  p_narticle VARCHAR(20),
  p_qte NUMERIC(15,2),
  p_prix NUMERIC(15,2),
  p_tva NUMERIC(15,2),
  p_total_ligne NUMERIC(15,2)
) RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  -- S'assurer que le schéma et les tables existent
  PERFORM ensure_purchase_schema(p_tenant);
  
  -- Insérer le détail
  EXECUTE format('
    INSERT INTO %I.detail_facture_achat (nfact_achat, narticle, qte, prix, tva, total_ligne) 
    VALUES ($1, $2, $3, $4, $5, $6)
  ', p_tenant)
  USING p_nfact_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
  
  RETURN format('Détail ajouté pour article %s', p_narticle);
END;
$function$;

-- 6. Fonction pour mettre à jour le stock lors d'un achat (ENTRÉE DE STOCK)
CREATE OR REPLACE FUNCTION update_stock_purchase_invoice(
  p_tenant TEXT,
  p_narticle VARCHAR(20),
  p_quantity NUMERIC(15,2)
) RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  -- Augmenter le stock_f (entrée de stock pour facture)
  EXECUTE format('
    UPDATE %I.article 
    SET stock_f = COALESCE(stock_f, 0) + $1
    WHERE narticle = $2
  ', p_tenant)
  USING p_quantity, p_narticle;
  
  RETURN format('Stock mis à jour: +%s pour article %s', p_quantity, p_narticle);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN format('Erreur mise à jour stock: %s', SQLERRM);
END;
$function$;

-- 7. Fonction pour récupérer la liste des factures d'achat
CREATE OR REPLACE FUNCTION get_purchase_invoices_list(p_tenant TEXT) 
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
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
  
  -- Vérifier si la table facture_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'facture_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Récupérer les factures d'achat
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nfact_achat'', nfact_achat,
        ''nfournisseur'', nfournisseur,
        ''numero_facture_fournisseur'', numero_facture_fournisseur,
        ''date_fact'', date_fact,
        ''montant_ht'', montant_ht,
        ''tva'', tva,
        ''total_ttc'', montant_ht + tva,
        ''created_at'', created_at
      )
    ) 
    FROM (
      SELECT * FROM %I.facture_achat ORDER BY nfact_achat DESC
    ) ordered_invoices
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$function$;

-- 8. Fonction pour récupérer une facture d'achat avec détails
CREATE OR REPLACE FUNCTION get_purchase_invoice_with_details(p_tenant TEXT, p_nfact_achat INTEGER) 
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  invoice_data JSON;
  details_data JSON;
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
  
  -- Vérifier si les tables existent
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'facture_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer la facture d'achat
  EXECUTE format('
    SELECT json_build_object(
      ''nfact_achat'', nfact_achat,
      ''nfournisseur'', nfournisseur,
      ''numero_facture_fournisseur'', numero_facture_fournisseur,
      ''date_fact'', date_fact,
      ''montant_ht'', montant_ht,
      ''tva'', tva,
      ''timbre'', COALESCE(timbre, 0),
      ''autre_taxe'', COALESCE(autre_taxe, 0),
      ''created_at'', created_at
    )
    FROM %I.facture_achat 
    WHERE nfact_achat = $1
  ', p_tenant) 
  USING p_nfact_achat INTO invoice_data;
  
  IF invoice_data IS NULL THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer les détails avec enrichissement des articles
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''narticle'', d.narticle,
        ''designation'', COALESCE(a.designation, ''Article '' || d.narticle),
        ''qte'', d.qte,
        ''prix'', d.prix,
        ''tva'', d.tva,
        ''total_ligne'', d.total_ligne
      )
    ) 
    FROM %I.detail_facture_achat d
    LEFT JOIN %I.article a ON d.narticle = a.narticle
    WHERE d.nfact_achat = $1
  ', p_tenant, p_tenant) 
  USING p_nfact_achat INTO details_data;
  
  -- Combiner les données
  SELECT json_build_object(
      'nfact_achat', (invoice_data->>'nfact_achat')::INTEGER,
      'nfournisseur', invoice_data->>'nfournisseur',
      'numero_facture_fournisseur', invoice_data->>'numero_facture_fournisseur',
      'date_fact', invoice_data->>'date_fact',
      'montant_ht', (invoice_data->>'montant_ht')::NUMERIC,
      'tva', (invoice_data->>'tva')::NUMERIC,
      'total_ttc', (invoice_data->>'montant_ht')::NUMERIC + (invoice_data->>'tva')::NUMERIC,
      'created_at', invoice_data->>'created_at',
      'details', COALESCE(details_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$function$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_next_purchase_invoice_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_supplier_invoice_exists TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ensure_purchase_schema TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_purchase_invoice_with_supplier_number TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_purchase_invoice TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_purchase_invoice TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_invoices_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_invoice_with_details TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_next_purchase_invoice_id IS 'Obtient le prochain ID interne de facture d''achat';
COMMENT ON FUNCTION check_supplier_invoice_exists IS 'Vérifie si un numéro de facture fournisseur existe déjà';
COMMENT ON FUNCTION insert_purchase_invoice_with_supplier_number IS 'Crée une facture d''achat avec numéro fournisseur';
COMMENT ON FUNCTION update_stock_purchase_invoice IS 'Met à jour le stock lors d''un achat (entrée de stock)';
COMMENT ON FUNCTION get_purchase_invoices_list IS 'Récupère la liste des factures d''achat';
COMMENT ON FUNCTION get_purchase_invoice_with_details IS 'Récupère une facture d''achat avec ses détails';

-- Test des fonctions (optionnel)
-- SELECT get_next_purchase_invoice_id('2025_bu01');
-- SELECT check_supplier_invoice_exists('2025_bu01', 'FOURNISSEUR1', 'FAC-2025-001');
-- SELECT get_purchase_invoices_list('2025_bu01');