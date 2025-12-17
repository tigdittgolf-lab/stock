-- =====================================================
-- FONCTIONS RPC POUR LES BONS DE LIVRAISON D'ACHATS
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS insert_purchase_bl_with_supplier_number(text,integer,text,text,date,numeric,numeric);
DROP FUNCTION IF EXISTS insert_detail_purchase_bl(text,integer,text,numeric,numeric,numeric,numeric);
DROP FUNCTION IF EXISTS get_next_purchase_bl_id(text);
DROP FUNCTION IF EXISTS check_supplier_bl_exists(text,text,text);
DROP FUNCTION IF EXISTS update_stock_purchase_bl(text,text,numeric);
DROP FUNCTION IF EXISTS get_purchase_bl_list(text);
DROP FUNCTION IF EXISTS get_purchase_bl_with_details(text,integer);
DROP FUNCTION IF EXISTS ensure_purchase_bl_schema(text);

-- 1. Fonction pour créer le schéma et les tables de BL achats si nécessaires
CREATE OR REPLACE FUNCTION ensure_purchase_bl_schema(p_tenant TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Créer le schéma s'il n'existe pas
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_tenant);
  
  -- Créer la table bl_achat s'elle n'existe pas
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.bl_achat (
          nbl_achat SERIAL PRIMARY KEY,
          nfournisseur VARCHAR(20),
          numero_bl_fournisseur VARCHAR(100),
          date_bl DATE,
          montant_ht DECIMAL(15,2) DEFAULT 0,
          timbre DECIMAL(15,2) DEFAULT 0,
          tva DECIMAL(15,2) DEFAULT 0,
          autre_taxe DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
  ', p_tenant);
  
  -- Créer la table detail_bl_achat s'elle n'existe pas
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.detail_bl_achat (
          id SERIAL PRIMARY KEY,
          nbl_achat INTEGER,
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

-- 2. Fonction pour obtenir le prochain ID interne de BL achat
CREATE OR REPLACE FUNCTION get_next_purchase_bl_id(p_tenant TEXT)
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
  
  -- Vérifier si la table bl_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'bl_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN 1;
  END IF;
  
  -- Obtenir le prochain ID interne
  EXECUTE format('
      SELECT COALESCE(MAX(nbl_achat), 0) + 1 
      FROM %I.bl_achat
  ', p_tenant) INTO next_id;
  
  RETURN COALESCE(next_id, 1);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN 1;
END;
$function$;

-- 3. Fonction pour vérifier si un numéro de BL fournisseur existe déjà
CREATE OR REPLACE FUNCTION check_supplier_bl_exists(
  p_tenant TEXT,
  p_nfournisseur TEXT,
  p_numero_bl TEXT
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
  
  -- Vérifier si la table bl_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'bl_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Chercher un BL existant avec ce numéro fournisseur
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nbl_achat'', nbl_achat,
        ''numero_bl_fournisseur'', numero_bl_fournisseur
      )
    ) 
    FROM %I.bl_achat 
    WHERE nfournisseur = $1 AND numero_bl_fournisseur = $2
  ', p_tenant) 
  USING p_nfournisseur, p_numero_bl INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$function$;

-- 4. Fonction pour créer un BL achat avec numéro fournisseur
CREATE OR REPLACE FUNCTION insert_purchase_bl_with_supplier_number(
  p_tenant TEXT,
  p_nbl_achat INTEGER,
  p_nfournisseur TEXT,
  p_numero_bl_fournisseur TEXT,
  p_date_bl DATE,
  p_montant_ht NUMERIC,
  p_tva NUMERIC
) RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  -- S'assurer que le schéma et les tables existent
  PERFORM ensure_purchase_bl_schema(p_tenant);
  
  -- Insérer le BL achat avec le numéro fournisseur
  EXECUTE format('
    INSERT INTO %I.bl_achat (
      nbl_achat, nfournisseur, numero_bl_fournisseur, date_bl, montant_ht, tva, 
      timbre, autre_taxe, created_at, updated_at
    ) 
    VALUES ($1, $2, $3, $4, $5, $6, 0, 0, NOW(), NOW())
  ', p_tenant)
  USING p_nbl_achat, p_nfournisseur, p_numero_bl_fournisseur, p_date_bl, p_montant_ht, p_tva;
  
  RETURN format('BL achat %s (%s) créé avec succès', p_numero_bl_fournisseur, p_nbl_achat);
END;
$function$;

-- 5. Fonction pour insérer un détail de BL achat
CREATE OR REPLACE FUNCTION insert_detail_purchase_bl(
  p_tenant TEXT,
  p_nbl_achat INTEGER,
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
  PERFORM ensure_purchase_bl_schema(p_tenant);
  
  -- Insérer le détail
  EXECUTE format('
    INSERT INTO %I.detail_bl_achat (nbl_achat, narticle, qte, prix, tva, total_ligne) 
    VALUES ($1, $2, $3, $4, $5, $6)
  ', p_tenant)
  USING p_nbl_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
  
  RETURN format('Détail ajouté pour article %s', p_narticle);
END;
$function$;

-- 6. Fonction pour mettre à jour le stock lors d'un BL achat (ENTRÉE DE STOCK BL)
CREATE OR REPLACE FUNCTION update_stock_purchase_bl(
  p_tenant TEXT,
  p_narticle VARCHAR(20),
  p_quantity NUMERIC(15,2)
) RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  -- Augmenter le stock_bl (entrée de stock pour BL)
  EXECUTE format('
    UPDATE %I.article 
    SET stock_bl = COALESCE(stock_bl, 0) + $1
    WHERE narticle = $2
  ', p_tenant)
  USING p_quantity, p_narticle;
  
  RETURN format('Stock BL mis à jour: +%s pour article %s', p_quantity, p_narticle);
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN format('Erreur mise à jour stock BL: %s', SQLERRM);
END;
$function$;

-- 7. Fonction pour récupérer la liste des BL achats
CREATE OR REPLACE FUNCTION get_purchase_bl_list(p_tenant TEXT) 
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
  
  -- Vérifier si la table bl_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'bl_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN '[]'::json;
  END IF;
  
  -- Récupérer les BL achats
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nbl_achat'', nbl_achat,
        ''nfournisseur'', nfournisseur,
        ''numero_bl_fournisseur'', numero_bl_fournisseur,
        ''date_bl'', date_bl,
        ''montant_ht'', montant_ht,
        ''tva'', tva,
        ''total_ttc'', montant_ht + tva,
        ''created_at'', created_at
      )
    ) 
    FROM (
      SELECT * FROM %I.bl_achat ORDER BY nbl_achat DESC
    ) ordered_bls
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$function$;

-- 8. Fonction pour récupérer un BL achat avec détails
CREATE OR REPLACE FUNCTION get_purchase_bl_with_details(p_tenant TEXT, p_nbl_achat INTEGER) 
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
DECLARE
  result JSON;
  bl_data JSON;
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
      WHERE table_schema = p_tenant AND table_name = 'bl_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer le BL achat
  EXECUTE format('
    SELECT json_build_object(
      ''nbl_achat'', nbl_achat,
      ''nfournisseur'', nfournisseur,
      ''numero_bl_fournisseur'', numero_bl_fournisseur,
      ''date_bl'', date_bl,
      ''montant_ht'', montant_ht,
      ''tva'', tva,
      ''timbre'', COALESCE(timbre, 0),
      ''autre_taxe'', COALESCE(autre_taxe, 0),
      ''created_at'', created_at
    )
    FROM %I.bl_achat 
    WHERE nbl_achat = $1
  ', p_tenant) 
  USING p_nbl_achat INTO bl_data;
  
  IF bl_data IS NULL THEN
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
    FROM %I.detail_bl_achat d
    LEFT JOIN %I.article a ON d.narticle = a.narticle
    WHERE d.nbl_achat = $1
  ', p_tenant, p_tenant) 
  USING p_nbl_achat INTO details_data;
  
  -- Combiner les données
  SELECT json_build_object(
      'nbl_achat', (bl_data->>'nbl_achat')::INTEGER,
      'nfournisseur', bl_data->>'nfournisseur',
      'numero_bl_fournisseur', bl_data->>'numero_bl_fournisseur',
      'date_bl', bl_data->>'date_bl',
      'montant_ht', (bl_data->>'montant_ht')::NUMERIC,
      'tva', (bl_data->>'tva')::NUMERIC,
      'total_ttc', (bl_data->>'montant_ht')::NUMERIC + (bl_data->>'tva')::NUMERIC,
      'created_at', bl_data->>'created_at',
      'details', COALESCE(details_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$function$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_next_purchase_bl_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_supplier_bl_exists TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ensure_purchase_bl_schema TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_purchase_bl_with_supplier_number TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_purchase_bl TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_purchase_bl TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_bl_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_bl_with_details TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_next_purchase_bl_id IS 'Obtient le prochain ID interne de BL achat';
COMMENT ON FUNCTION check_supplier_bl_exists IS 'Vérifie si un numéro de BL fournisseur existe déjà';
COMMENT ON FUNCTION insert_purchase_bl_with_supplier_number IS 'Crée un BL achat avec numéro fournisseur';
COMMENT ON FUNCTION update_stock_purchase_bl IS 'Met à jour le stock_bl lors d''un BL achat (entrée de stock)';
COMMENT ON FUNCTION get_purchase_bl_list IS 'Récupère la liste des BL achats';
COMMENT ON FUNCTION get_purchase_bl_with_details IS 'Récupère un BL achat avec ses détails';

-- Test des fonctions (optionnel)
-- SELECT get_next_purchase_bl_id('2025_bu01');
-- SELECT check_supplier_bl_exists('2025_bu01', 'FOURNISSEUR1', 'BL-2025-001');
-- SELECT get_purchase_bl_list('2025_bu01');