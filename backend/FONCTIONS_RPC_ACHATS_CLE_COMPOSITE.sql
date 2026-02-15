-- =====================================================
-- FONCTIONS RPC POUR LE SYSTÈME D'ACHATS - CLÉ COMPOSITE
-- Utilise (numero_facture_fournisseur, nfournisseur) comme clé primaire
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS insert_purchase_invoice_composite(text,text,text,date,numeric,numeric);
DROP FUNCTION IF EXISTS insert_detail_purchase_invoice_composite(text,text,text,text,numeric,numeric,numeric,numeric);
DROP FUNCTION IF EXISTS check_supplier_invoice_exists_composite(text,text,text);
DROP FUNCTION IF EXISTS update_stock_purchase_invoice_composite(text,text,numeric);
DROP FUNCTION IF EXISTS get_purchase_invoices_list_composite(text);
DROP FUNCTION IF EXISTS get_purchase_invoice_with_details_composite(text,text,text);
DROP FUNCTION IF EXISTS ensure_purchase_schema_composite(text);

-- 1. Fonction pour créer le schéma et les tables d'achats avec clé composite
CREATE OR REPLACE FUNCTION ensure_purchase_schema_composite(p_tenant TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Créer le schéma s'il n'existe pas
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_tenant);
  
  -- Créer la table facture_achat avec clé composite
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.facture_achat (
          numero_facture_fournisseur VARCHAR(100) NOT NULL,
          nfournisseur VARCHAR(20) NOT NULL,
          date_fact DATE,
          montant_ht DECIMAL(15,2) DEFAULT 0,
          timbre DECIMAL(15,2) DEFAULT 0,
          tva DECIMAL(15,2) DEFAULT 0,
          autre_taxe DECIMAL(15,2) DEFAULT 0,
          payer BOOLEAN DEFAULT false,
          banq VARCHAR(100),
          ncheque VARCHAR(50),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (numero_facture_fournisseur, nfournisseur)
      )
  ', p_tenant);
  
  -- Créer la table detail_facture_achat avec clé composite
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.detail_facture_achat (
          numero_facture_fournisseur VARCHAR(100) NOT NULL,
          nfournisseur VARCHAR(20) NOT NULL,
          narticle VARCHAR(20) NOT NULL,
          qte DECIMAL(15,2),
          prix DECIMAL(15,2),
          tva DECIMAL(15,2),
          total_ligne DECIMAL(15,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (numero_facture_fournisseur, nfournisseur, narticle),
          FOREIGN KEY (numero_facture_fournisseur, nfournisseur) 
            REFERENCES %I.facture_achat(numero_facture_fournisseur, nfournisseur) 
            ON DELETE CASCADE
      )
  ', p_tenant, p_tenant);
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN FALSE;
END;
$function$;

-- 2. Fonction pour vérifier si une facture fournisseur existe déjà
CREATE OR REPLACE FUNCTION check_supplier_invoice_exists_composite(
  p_tenant TEXT,
  p_nfournisseur TEXT,
  p_numero_facture TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  exists_flag BOOLEAN;
  schema_exists BOOLEAN;
  table_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN FALSE;
  END IF;
  
  -- Vérifier si la table facture_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'facture_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN FALSE;
  END IF;
  
  -- Chercher une facture existante
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 FROM %I.facture_achat 
      WHERE nfournisseur = $1 AND numero_facture_fournisseur = $2
    )
  ', p_tenant) 
  USING p_nfournisseur, p_numero_facture INTO exists_flag;
  
  RETURN COALESCE(exists_flag, FALSE);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN FALSE;
END;
$function$;

-- 3. Fonction pour créer une facture d'achat
CREATE OR REPLACE FUNCTION insert_purchase_invoice_composite(
  p_tenant TEXT,
  p_numero_facture_fournisseur TEXT,
  p_nfournisseur TEXT,
  p_date_fact DATE,
  p_montant_ht NUMERIC,
  p_tva NUMERIC
) RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  -- S'assurer que le schéma et les tables existent
  PERFORM ensure_purchase_schema_composite(p_tenant);
  
  -- Vérifier si la facture existe déjà
  IF check_supplier_invoice_exists_composite(p_tenant, p_nfournisseur, p_numero_facture_fournisseur) THEN
    RETURN format('ERREUR: La facture %s du fournisseur %s existe déjà', 
                  p_numero_facture_fournisseur, p_nfournisseur);
  END IF;
  
  -- Insérer la facture d'achat
  EXECUTE format('
    INSERT INTO %I.facture_achat (
      numero_facture_fournisseur, nfournisseur, date_fact, montant_ht, tva, 
      timbre, autre_taxe, payer, banq, ncheque, created_at, updated_at
    ) 
    VALUES ($1, $2, $3, $4, $5, 0, 0, false, '''', '''', NOW(), NOW())
  ', p_tenant)
  USING p_numero_facture_fournisseur, p_nfournisseur, p_date_fact, p_montant_ht, p_tva;
  
  RETURN format('Facture d''achat %s du fournisseur %s créée avec succès', 
                p_numero_facture_fournisseur, p_nfournisseur);
END;
$function$;

-- 4. Fonction pour insérer un détail de facture d'achat
CREATE OR REPLACE FUNCTION insert_detail_purchase_invoice_composite(
  p_tenant TEXT,
  p_numero_facture_fournisseur TEXT,
  p_nfournisseur TEXT,
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
  PERFORM ensure_purchase_schema_composite(p_tenant);
  
  -- Insérer le détail
  EXECUTE format('
    INSERT INTO %I.detail_facture_achat 
    (numero_facture_fournisseur, nfournisseur, narticle, qte, prix, tva, total_ligne) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (numero_facture_fournisseur, nfournisseur, narticle) 
    DO UPDATE SET 
      qte = EXCLUDED.qte,
      prix = EXCLUDED.prix,
      tva = EXCLUDED.tva,
      total_ligne = EXCLUDED.total_ligne
  ', p_tenant)
  USING p_numero_facture_fournisseur, p_nfournisseur, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
  
  RETURN format('Détail ajouté pour article %s', p_narticle);
END;
$function$;

-- 5. Fonction pour mettre à jour le stock lors d'un achat (ENTRÉE DE STOCK)
CREATE OR REPLACE FUNCTION update_stock_purchase_invoice_composite(
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

-- 6. Fonction pour récupérer la liste des factures d'achat
CREATE OR REPLACE FUNCTION get_purchase_invoices_list_composite(p_tenant TEXT) 
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
        ''numero_facture_fournisseur'', numero_facture_fournisseur,
        ''nfournisseur'', nfournisseur,
        ''date_fact'', date_fact,
        ''montant_ht'', montant_ht,
        ''tva'', tva,
        ''total_ttc'', montant_ht + tva,
        ''payer'', payer,
        ''created_at'', created_at
      )
    ) 
    FROM (
      SELECT * FROM %I.facture_achat 
      ORDER BY date_fact DESC, numero_facture_fournisseur DESC
    ) ordered_invoices
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$function$;

-- 7. Fonction pour récupérer une facture d'achat avec détails
CREATE OR REPLACE FUNCTION get_purchase_invoice_with_details_composite(
  p_tenant TEXT, 
  p_numero_facture_fournisseur TEXT,
  p_nfournisseur TEXT
) 
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
      ''numero_facture_fournisseur'', numero_facture_fournisseur,
      ''nfournisseur'', nfournisseur,
      ''date_fact'', date_fact,
      ''montant_ht'', montant_ht,
      ''tva'', tva,
      ''timbre'', COALESCE(timbre, 0),
      ''autre_taxe'', COALESCE(autre_taxe, 0),
      ''payer'', payer,
      ''created_at'', created_at
    )
    FROM %I.facture_achat 
    WHERE numero_facture_fournisseur = $1 AND nfournisseur = $2
  ', p_tenant) 
  USING p_numero_facture_fournisseur, p_nfournisseur INTO invoice_data;
  
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
    WHERE d.numero_facture_fournisseur = $1 AND d.nfournisseur = $2
  ', p_tenant, p_tenant) 
  USING p_numero_facture_fournisseur, p_nfournisseur INTO details_data;
  
  -- Combiner les données
  SELECT json_build_object(
      'numero_facture_fournisseur', invoice_data->>'numero_facture_fournisseur',
      'nfournisseur', invoice_data->>'nfournisseur',
      'date_fact', invoice_data->>'date_fact',
      'montant_ht', (invoice_data->>'montant_ht')::NUMERIC,
      'tva', (invoice_data->>'tva')::NUMERIC,
      'total_ttc', (invoice_data->>'montant_ht')::NUMERIC + (invoice_data->>'tva')::NUMERIC,
      'payer', (invoice_data->>'payer')::BOOLEAN,
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
GRANT EXECUTE ON FUNCTION check_supplier_invoice_exists_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ensure_purchase_schema_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_purchase_invoice_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_purchase_invoice_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_purchase_invoice_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_invoices_list_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_invoice_with_details_composite TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION check_supplier_invoice_exists_composite IS 'Vérifie si une facture fournisseur existe (clé composite)';
COMMENT ON FUNCTION insert_purchase_invoice_composite IS 'Crée une facture d''achat avec clé composite (numero_facture_fournisseur, nfournisseur)';
COMMENT ON FUNCTION update_stock_purchase_invoice_composite IS 'Met à jour le stock lors d''un achat (entrée de stock)';
COMMENT ON FUNCTION get_purchase_invoices_list_composite IS 'Récupère la liste des factures d''achat';
COMMENT ON FUNCTION get_purchase_invoice_with_details_composite IS 'Récupère une facture d''achat avec ses détails';
