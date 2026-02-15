-- =====================================================
-- FONCTIONS RPC POUR LES BONS DE LIVRAISON D'ACHATS - CLÉ COMPOSITE
-- Utilise (numero_bl_fournisseur, nfournisseur) comme clé primaire
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer les anciennes fonctions si elles existent
DROP FUNCTION IF EXISTS insert_purchase_bl_composite(text,text,text,date,numeric,numeric);
DROP FUNCTION IF EXISTS insert_detail_purchase_bl_composite(text,text,text,text,numeric,numeric,numeric,numeric);
DROP FUNCTION IF EXISTS check_supplier_bl_exists_composite(text,text,text);
DROP FUNCTION IF EXISTS update_stock_purchase_bl_composite(text,text,numeric);
DROP FUNCTION IF EXISTS get_purchase_bl_list_composite(text);
DROP FUNCTION IF EXISTS get_purchase_bl_with_details_composite(text,text,text);
DROP FUNCTION IF EXISTS ensure_purchase_bl_schema_composite(text);

-- 1. Fonction pour créer le schéma et les tables de BL achats avec clé composite
CREATE OR REPLACE FUNCTION ensure_purchase_bl_schema_composite(p_tenant TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  -- Créer le schéma s'il n'existe pas
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_tenant);
  
  -- Créer la table bl_achat avec clé composite
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.bl_achat (
          numero_bl_fournisseur VARCHAR(100) NOT NULL,
          nfournisseur VARCHAR(20) NOT NULL,
          date_bl DATE,
          montant_ht DECIMAL(15,2) DEFAULT 0,
          timbre DECIMAL(15,2) DEFAULT 0,
          tva DECIMAL(15,2) DEFAULT 0,
          autre_taxe DECIMAL(15,2) DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (numero_bl_fournisseur, nfournisseur)
      )
  ', p_tenant);
  
  -- Créer la table detail_bl_achat avec clé composite
  EXECUTE format('
      CREATE TABLE IF NOT EXISTS %I.detail_bl_achat (
          numero_bl_fournisseur VARCHAR(100) NOT NULL,
          nfournisseur VARCHAR(20) NOT NULL,
          narticle VARCHAR(20) NOT NULL,
          qte DECIMAL(15,2),
          prix DECIMAL(15,2),
          tva DECIMAL(15,2),
          total_ligne DECIMAL(15,2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (numero_bl_fournisseur, nfournisseur, narticle),
          FOREIGN KEY (numero_bl_fournisseur, nfournisseur) 
            REFERENCES %I.bl_achat(numero_bl_fournisseur, nfournisseur) 
            ON DELETE CASCADE
      )
  ', p_tenant, p_tenant);
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN FALSE;
END;
$function$;

-- 2. Fonction pour vérifier si un BL fournisseur existe déjà
CREATE OR REPLACE FUNCTION check_supplier_bl_exists_composite(
  p_tenant TEXT,
  p_nfournisseur TEXT,
  p_numero_bl TEXT
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
  
  -- Vérifier si la table bl_achat existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = p_tenant AND table_name = 'bl_achat'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN FALSE;
  END IF;
  
  -- Chercher un BL existant
  EXECUTE format('
    SELECT EXISTS(
      SELECT 1 FROM %I.bl_achat 
      WHERE nfournisseur = $1 AND numero_bl_fournisseur = $2
    )
  ', p_tenant) 
  USING p_nfournisseur, p_numero_bl INTO exists_flag;
  
  RETURN COALESCE(exists_flag, FALSE);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN FALSE;
END;
$function$;

-- 3. Fonction pour créer un BL achat
CREATE OR REPLACE FUNCTION insert_purchase_bl_composite(
  p_tenant TEXT,
  p_numero_bl_fournisseur TEXT,
  p_nfournisseur TEXT,
  p_date_bl DATE,
  p_montant_ht NUMERIC,
  p_tva NUMERIC
) RETURNS TEXT
LANGUAGE plpgsql 
SECURITY DEFINER
AS $function$
BEGIN
  -- S'assurer que le schéma et les tables existent
  PERFORM ensure_purchase_bl_schema_composite(p_tenant);
  
  -- Vérifier si le BL existe déjà
  IF check_supplier_bl_exists_composite(p_tenant, p_nfournisseur, p_numero_bl_fournisseur) THEN
    RETURN format('ERREUR: Le BL %s du fournisseur %s existe déjà', 
                  p_numero_bl_fournisseur, p_nfournisseur);
  END IF;
  
  -- Insérer le BL achat
  EXECUTE format('
    INSERT INTO %I.bl_achat (
      numero_bl_fournisseur, nfournisseur, date_bl, montant_ht, tva, 
      timbre, autre_taxe, created_at, updated_at
    ) 
    VALUES ($1, $2, $3, $4, $5, 0, 0, NOW(), NOW())
  ', p_tenant)
  USING p_numero_bl_fournisseur, p_nfournisseur, p_date_bl, p_montant_ht, p_tva;
  
  RETURN format('BL achat %s du fournisseur %s créé avec succès', 
                p_numero_bl_fournisseur, p_nfournisseur);
END;
$function$;

-- 4. Fonction pour insérer un détail de BL achat
CREATE OR REPLACE FUNCTION insert_detail_purchase_bl_composite(
  p_tenant TEXT,
  p_numero_bl_fournisseur TEXT,
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
  PERFORM ensure_purchase_bl_schema_composite(p_tenant);
  
  -- Insérer le détail
  EXECUTE format('
    INSERT INTO %I.detail_bl_achat 
    (numero_bl_fournisseur, nfournisseur, narticle, qte, prix, tva, total_ligne) 
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    ON CONFLICT (numero_bl_fournisseur, nfournisseur, narticle) 
    DO UPDATE SET 
      qte = EXCLUDED.qte,
      prix = EXCLUDED.prix,
      tva = EXCLUDED.tva,
      total_ligne = EXCLUDED.total_ligne
  ', p_tenant)
  USING p_numero_bl_fournisseur, p_nfournisseur, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
  
  RETURN format('Détail ajouté pour article %s', p_narticle);
END;
$function$;

-- 5. Fonction pour mettre à jour le stock lors d'un BL achat (ENTRÉE DE STOCK BL)
CREATE OR REPLACE FUNCTION update_stock_purchase_bl_composite(
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

-- 6. Fonction pour récupérer la liste des BL achats
CREATE OR REPLACE FUNCTION get_purchase_bl_list_composite(p_tenant TEXT) 
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
        ''numero_bl_fournisseur'', numero_bl_fournisseur,
        ''nfournisseur'', nfournisseur,
        ''date_bl'', date_bl,
        ''montant_ht'', montant_ht,
        ''tva'', tva,
        ''total_ttc'', montant_ht + tva,
        ''created_at'', created_at
      )
    ) 
    FROM (
      SELECT * FROM %I.bl_achat 
      ORDER BY date_bl DESC, numero_bl_fournisseur DESC
    ) ordered_bls
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$function$;

-- 7. Fonction pour récupérer un BL achat avec détails
CREATE OR REPLACE FUNCTION get_purchase_bl_with_details_composite(
  p_tenant TEXT, 
  p_numero_bl_fournisseur TEXT,
  p_nfournisseur TEXT
) 
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
      ''numero_bl_fournisseur'', numero_bl_fournisseur,
      ''nfournisseur'', nfournisseur,
      ''date_bl'', date_bl,
      ''montant_ht'', montant_ht,
      ''tva'', tva,
      ''timbre'', COALESCE(timbre, 0),
      ''autre_taxe'', COALESCE(autre_taxe, 0),
      ''created_at'', created_at
    )
    FROM %I.bl_achat 
    WHERE numero_bl_fournisseur = $1 AND nfournisseur = $2
  ', p_tenant) 
  USING p_numero_bl_fournisseur, p_nfournisseur INTO bl_data;
  
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
    WHERE d.numero_bl_fournisseur = $1 AND d.nfournisseur = $2
  ', p_tenant, p_tenant) 
  USING p_numero_bl_fournisseur, p_nfournisseur INTO details_data;
  
  -- Combiner les données
  SELECT json_build_object(
      'numero_bl_fournisseur', bl_data->>'numero_bl_fournisseur',
      'nfournisseur', bl_data->>'nfournisseur',
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
GRANT EXECUTE ON FUNCTION check_supplier_bl_exists_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION ensure_purchase_bl_schema_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_purchase_bl_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_purchase_bl_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_purchase_bl_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_bl_list_composite TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_bl_with_details_composite TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION check_supplier_bl_exists_composite IS 'Vérifie si un BL fournisseur existe (clé composite)';
COMMENT ON FUNCTION insert_purchase_bl_composite IS 'Crée un BL achat avec clé composite (numero_bl_fournisseur, nfournisseur)';
COMMENT ON FUNCTION update_stock_purchase_bl_composite IS 'Met à jour le stock_bl lors d''un BL achat (entrée de stock)';
COMMENT ON FUNCTION get_purchase_bl_list_composite IS 'Récupère la liste des BL achats';
COMMENT ON FUNCTION get_purchase_bl_with_details_composite IS 'Récupère un BL achat avec ses détails';
