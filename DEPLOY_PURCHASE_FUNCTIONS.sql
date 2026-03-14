-- =====================================================
-- DÉPLOIEMENT FONCTIONS RPC ACHATS - FACTURES & BL
-- Exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- Supprimer TOUTES les surcharges de chaque fonction (peu importe les types d'arguments)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT oid::regprocedure::text AS sig
    FROM pg_proc
    WHERE proname IN (
      'ensure_purchase_schema',
      'get_next_purchase_invoice_id',
      'check_supplier_invoice_exists',
      'insert_purchase_invoice_with_supplier_number',
      'insert_detail_purchase_invoice',
      'update_stock_purchase_invoice',
      'update_stock_purchase_bl',
      'get_purchase_invoices_list',
      'get_purchase_invoice_with_details',
      'update_purchase_invoice_full'
    )
    AND pg_function_is_visible(oid)
  LOOP
    EXECUTE 'DROP FUNCTION IF EXISTS ' || r.sig || ' CASCADE';
  END LOOP;
END;
$$;

-- =====================================================
-- 1. ensure_purchase_schema
-- =====================================================
CREATE OR REPLACE FUNCTION ensure_purchase_schema(p_tenant TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', p_tenant);

  EXECUTE format('
    CREATE TABLE IF NOT EXISTS %I.facture_achat (
      nfact_achat SERIAL PRIMARY KEY,
      nfournisseur VARCHAR(20),
      numero_facture_fournisseur VARCHAR(100),
      date_fact DATE,
      montant_ht DECIMAL(15,2) DEFAULT 0,
      tva DECIMAL(15,2) DEFAULT 0,
      timbre DECIMAL(15,2) DEFAULT 0,
      autre_taxe DECIMAL(15,2) DEFAULT 0,
      payer BOOLEAN DEFAULT false,
      banq VARCHAR(100),
      ncheque VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  ', p_tenant);

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
EXCEPTION WHEN OTHERS THEN RETURN FALSE;
END;
$function$;

-- =====================================================
-- 2. get_next_purchase_invoice_id
-- =====================================================
CREATE OR REPLACE FUNCTION get_next_purchase_invoice_id(p_tenant TEXT)
RETURNS INTEGER LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE next_id INTEGER;
BEGIN
  PERFORM ensure_purchase_schema(p_tenant);
  EXECUTE format('SELECT COALESCE(MAX(nfact_achat), 0) + 1 FROM %I.facture_achat', p_tenant) INTO next_id;
  RETURN COALESCE(next_id, 1);
EXCEPTION WHEN OTHERS THEN RETURN 1;
END;
$function$;

-- =====================================================
-- 3. check_supplier_invoice_exists
-- =====================================================
CREATE OR REPLACE FUNCTION check_supplier_invoice_exists(p_tenant TEXT, p_nfournisseur TEXT, p_numero_facture TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(json_build_object(''nfact_achat'', nfact_achat))
    FROM %I.facture_achat
    WHERE nfournisseur = $1 AND numero_facture_fournisseur = $2
  ', p_tenant) USING p_nfournisseur, p_numero_facture INTO result;
  RETURN COALESCE(result, '[]'::json);
EXCEPTION WHEN OTHERS THEN RETURN '[]'::json;
END;
$function$;

-- =====================================================
-- 4. insert_purchase_invoice_with_supplier_number
-- =====================================================
CREATE OR REPLACE FUNCTION insert_purchase_invoice_with_supplier_number(
  p_tenant TEXT, p_nfact_achat INTEGER, p_nfournisseur TEXT,
  p_numero_facture_fournisseur TEXT, p_date_fact DATE,
  p_montant_ht NUMERIC, p_tva NUMERIC
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  PERFORM ensure_purchase_schema(p_tenant);
  EXECUTE format('
    INSERT INTO %I.facture_achat
      (nfact_achat, nfournisseur, numero_facture_fournisseur, date_fact, montant_ht, tva,
       timbre, autre_taxe, payer, banq, ncheque, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, 0, 0, false, '''', '''', NOW(), NOW())
  ', p_tenant)
  USING p_nfact_achat, p_nfournisseur, p_numero_facture_fournisseur, p_date_fact, p_montant_ht, p_tva;
  RETURN format('Facture %s créée', p_numero_facture_fournisseur);
END;
$function$;

-- =====================================================
-- 5. insert_detail_purchase_invoice
-- =====================================================
CREATE OR REPLACE FUNCTION insert_detail_purchase_invoice(
  p_tenant TEXT, p_nfact_achat INTEGER, p_narticle VARCHAR(20),
  p_qte NUMERIC, p_prix NUMERIC, p_tva NUMERIC, p_total_ligne NUMERIC
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  PERFORM ensure_purchase_schema(p_tenant);
  EXECUTE format('
    INSERT INTO %I.detail_facture_achat (nfact_achat, narticle, qte, prix, tva, total_ligne)
    VALUES ($1, $2, $3, $4, $5, $6)
  ', p_tenant) USING p_nfact_achat, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
  RETURN format('Détail ajouté: %s', p_narticle);
END;
$function$;

-- =====================================================
-- 6. get_purchase_invoices_list (update_stock_purchase_invoice défini plus bas)
-- =====================================================
CREATE OR REPLACE FUNCTION get_purchase_invoices_list(p_tenant TEXT)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = p_tenant) THEN
    RETURN '[]'::json;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = p_tenant AND table_name = 'facture_achat') THEN
    RETURN '[]'::json;
  END IF;

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
    FROM (SELECT * FROM %I.facture_achat ORDER BY nfact_achat DESC) t
  ', p_tenant) INTO result;

  RETURN COALESCE(result, '[]'::json);
EXCEPTION WHEN OTHERS THEN RETURN '[]'::json;
END;
$function$;

-- =====================================================
-- 8. get_purchase_invoice_with_details
-- =====================================================
CREATE OR REPLACE FUNCTION get_purchase_invoice_with_details(p_tenant TEXT, p_nfact_achat INTEGER)
RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE
  v_header JSON;
  v_details JSON;
  result JSON;
BEGIN
  EXECUTE format('
    SELECT row_to_json(t) FROM (
      SELECT nfact_achat, nfournisseur, numero_facture_fournisseur,
             date_fact, montant_ht, tva, montant_ht + tva AS total_ttc, created_at
      FROM %I.facture_achat WHERE nfact_achat = $1
    ) t
  ', p_tenant) USING p_nfact_achat INTO v_header;

  IF v_header IS NULL THEN RETURN NULL; END IF;

  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''narticle'', narticle, ''qte'', qte,
        ''prix'', prix, ''tva'', tva, ''total_ligne'', total_ligne
      )
    ) FROM %I.detail_facture_achat WHERE nfact_achat = $1
  ', p_tenant) USING p_nfact_achat INTO v_details;

  SELECT v_header::jsonb || jsonb_build_object('details', COALESCE(v_details, '[]'::json)) INTO result;
  RETURN result;
EXCEPTION WHEN OTHERS THEN RETURN NULL;
END;
$function$;

-- =====================================================
-- PERMISSIONS
-- =====================================================
GRANT EXECUTE ON FUNCTION ensure_purchase_schema TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_next_purchase_invoice_id TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_supplier_invoice_exists TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_purchase_invoice_with_supplier_number TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_purchase_invoice TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_invoices_list TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_purchase_invoice_with_details TO anon, authenticated;

-- =====================================================
-- TEST (remplacer '2009_bu02' par votre tenant)
-- =====================================================
-- SELECT get_purchase_invoices_list('2009_bu02');
-- SELECT get_next_purchase_invoice_id('2009_bu02');

-- =====================================================
-- FONCTIONS POUR LA MODIFICATION DE FACTURE D'ACHAT
-- =====================================================

-- =====================================================
-- FONCTION UNIQUE POUR MODIFIER UNE FACTURE D'ACHAT
-- Une seule fonction qui fait tout en une transaction
-- =====================================================

CREATE OR REPLACE FUNCTION update_purchase_invoice_full(
  p_tenant TEXT,
  p_nfact_achat INTEGER,
  p_nfournisseur TEXT,
  p_numero_facture_fournisseur TEXT,
  p_date_fact DATE,
  p_montant_ht NUMERIC,
  p_tva NUMERIC,
  p_details JSONB
) RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $function$
DECLARE
  detail JSONB;
BEGIN
  -- 1. Mettre à jour l'entête
  EXECUTE format('
    UPDATE %I.facture_achat
    SET nfournisseur = $1, numero_facture_fournisseur = $2,
        date_fact = $3, montant_ht = $4, tva = $5, updated_at = NOW()
    WHERE nfact_achat = $6
  ', p_tenant)
  USING p_nfournisseur, p_numero_facture_fournisseur, p_date_fact, p_montant_ht, p_tva, p_nfact_achat;

  -- 2. Supprimer les anciens détails
  EXECUTE format('DELETE FROM %I.detail_facture_achat WHERE nfact_achat = $1', p_tenant)
  USING p_nfact_achat;

  -- 3. Réinsérer les nouveaux détails
  FOR detail IN SELECT * FROM jsonb_array_elements(p_details)
  LOOP
    EXECUTE format('
      INSERT INTO %I.detail_facture_achat (nfact_achat, narticle, qte, prix, tva, total_ligne)
      VALUES ($1, $2, $3, $4, $5, $6)
    ', p_tenant)
    USING
      p_nfact_achat,
      detail->>'narticle',
      (detail->>'qte')::NUMERIC,
      (detail->>'prix')::NUMERIC,
      (detail->>'tva')::NUMERIC,
      (detail->>'total_ligne')::NUMERIC;
  END LOOP;

  RETURN 'OK';
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION '%', SQLERRM;
END;
$function$;

GRANT EXECUTE ON FUNCTION update_purchase_invoice_full TO anon, authenticated;

-- =====================================================
-- MISE À JOUR STOCK LORS D'UN ACHAT (ENTRÉE = +)
-- =====================================================

-- Facture d'achat → augmente stock_f
CREATE OR REPLACE FUNCTION update_stock_purchase_invoice(p_tenant TEXT, p_narticle TEXT, p_quantity NUMERIC)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  EXECUTE format('
    UPDATE %I.article SET stock_f = COALESCE(stock_f, 0) + $1 WHERE narticle = $2
  ', p_tenant) USING p_quantity, p_narticle;
  RETURN format('stock_f +%s pour %s', p_quantity, p_narticle);
EXCEPTION WHEN OTHERS THEN RETURN format('Erreur stock: %s', SQLERRM);
END;
$function$;

-- BL d'achat → augmente stock_bl
CREATE OR REPLACE FUNCTION update_stock_purchase_bl(p_tenant TEXT, p_narticle TEXT, p_quantity NUMERIC)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $function$
BEGIN
  EXECUTE format('
    UPDATE %I.article SET stock_bl = COALESCE(stock_bl, 0) + $1 WHERE narticle = $2
  ', p_tenant) USING p_quantity, p_narticle;
  RETURN format('stock_bl +%s pour %s', p_quantity, p_narticle);
EXCEPTION WHEN OTHERS THEN RETURN format('Erreur stock: %s', SQLERRM);
END;
$function$;

GRANT EXECUTE ON FUNCTION update_stock_purchase_invoice TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_stock_purchase_bl TO anon, authenticated;
