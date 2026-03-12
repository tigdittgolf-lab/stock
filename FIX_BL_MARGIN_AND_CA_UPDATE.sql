-- ============================================================================
-- CORRECTION: Calcul marge + Mise à jour CA client lors création BL/Facture
-- ============================================================================

-- ÉTAPE 1: Vérifier que les colonnes marge existent
SELECT 'Vérification colonnes marge dans BL' as info;
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'bl'
  AND column_name IN ('marge', 'marge_percent');

SELECT 'Vérification colonnes marge dans FACT' as info;
SELECT column_name 
FROM information_schema.columns
WHERE table_schema = '2009_bu02'
  AND table_name = 'fact'
  AND column_name IN ('marge', 'marge_percent');

-- ÉTAPE 2: Créer fonction pour calculer la marge d'un document
DROP FUNCTION IF EXISTS calculate_document_margin(TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION calculate_document_margin(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_document_type TEXT -- 'bl' ou 'fact'
)
RETURNS NUMERIC -- Retourne seulement la marge, pas le pourcentage
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  v_detail_table TEXT;
  v_total_ht NUMERIC := 0;
  v_total_cost NUMERIC := 0;
  v_marge NUMERIC := 0;
BEGIN
  -- Déterminer la table de détails
  IF p_document_type = 'bl' THEN
    v_detail_table := 'detail_bl';
  ELSIF p_document_type = 'fact' THEN
    v_detail_table := 'detail_fact';
  ELSE
    RAISE EXCEPTION 'Type de document invalide: %', p_document_type;
  END IF;

  -- Calculer le coût total et le montant HT
  sql_query := format('
    SELECT 
      COALESCE(SUM(d."Qte" * d.prix), 0) as total_ht,
      COALESCE(SUM(d."Qte" * COALESCE(a.prix_unitaire, 0)), 0) as total_cost
    FROM %I.%I d
    LEFT JOIN %I.article a ON a."Narticle" = d."Narticle"
    WHERE d."NFact" = %s
  ', p_tenant, v_detail_table, p_tenant, p_nfact);
  
  EXECUTE sql_query INTO v_total_ht, v_total_cost;
  
  -- Calculer la marge
  v_marge := v_total_ht - v_total_cost;
  
  RETURN v_marge;
END;
$$;

-- ÉTAPE 3: Créer fonction pour mettre à jour le CA client
DROP FUNCTION IF EXISTS update_client_ca(TEXT, TEXT, NUMERIC, TEXT);

CREATE OR REPLACE FUNCTION update_client_ca(
  p_tenant TEXT,
  p_nclient TEXT,
  p_montant_ttc NUMERIC,
  p_document_type TEXT -- 'bl' ou 'fact'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  v_ca_field TEXT;
BEGIN
  -- Déterminer le champ CA à mettre à jour
  IF p_document_type = 'bl' THEN
    v_ca_field := '"C_affaire_bl"';
  ELSIF p_document_type = 'fact' THEN
    v_ca_field := '"C_affaire_fact"';
  ELSE
    RAISE EXCEPTION 'Type de document invalide: %', p_document_type;
  END IF;

  -- Mettre à jour le CA du client
  sql_query := format('
    UPDATE %I.client 
    SET %s = COALESCE(%s, 0) + %s
    WHERE "Nclient" = %L
  ', p_tenant, v_ca_field, v_ca_field, p_montant_ttc, p_nclient);
  
  EXECUTE sql_query;
  
  RETURN format('CA client %s mis à jour: +%s DA', p_nclient, p_montant_ttc);
END;
$$;

-- ÉTAPE 4: Recréer insert_bl_simple avec calcul marge et MAJ CA
-- Supprimer toutes les versions existantes
DROP FUNCTION IF EXISTS insert_bl_simple(TEXT, INTEGER, TEXT, DATE, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS insert_bl_simple(TEXT, TEXT, TEXT, DATE, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS insert_bl_simple CASCADE;

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
  v_montant_ttc NUMERIC;
BEGIN
  -- Calculer le montant TTC
  v_montant_ttc := p_montant_ht + p_tva;
  
  -- Insérer le BL (marge sera calculée après insertion des détails)
  sql_query := format('
    INSERT INTO %I.bl (
      "NFact", "Nclient", date_fact, montant_ht, "TVA", timbre, autre_taxe, 
      facturer, banq, ncheque, "NBC", date_bc, nom_preneur, marge
    ) VALUES (
      %s, %L, %L, %s, %s, 0, 0,
      0, '''', '''', '''', %L, '''', 0
    )',
    p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_date_fact
  );
  
  EXECUTE sql_query;
  
  -- Mettre à jour le CA du client
  PERFORM update_client_ca(p_tenant, p_nclient, v_montant_ttc, 'bl');
  
  RETURN format('BL %s créé avec succès pour client %s (CA mis à jour)', p_nfact, p_nclient);
END;
$$;

-- ÉTAPE 5: Créer fonction pour mettre à jour la marge après insertion des détails
DROP FUNCTION IF EXISTS update_document_margin(TEXT, INTEGER, TEXT);

CREATE OR REPLACE FUNCTION update_document_margin(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_document_type TEXT -- 'bl' ou 'fact'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sql_query TEXT;
  v_table_name TEXT;
  v_marge NUMERIC;
BEGIN
  -- Déterminer la table
  IF p_document_type = 'bl' THEN
    v_table_name := 'bl';
  ELSIF p_document_type = 'fact' THEN
    v_table_name := 'fact';
  ELSE
    RAISE EXCEPTION 'Type de document invalide: %', p_document_type;
  END IF;

  -- Calculer la marge
  v_marge := calculate_document_margin(p_tenant, p_nfact, p_document_type);
  
  -- Mettre à jour le document
  sql_query := format('
    UPDATE %I.%I 
    SET marge = %s
    WHERE "NFact" = %s
  ', p_tenant, v_table_name, v_marge, p_nfact);
  
  EXECUTE sql_query;
  
  RETURN format('Marge mise à jour pour %s %s: %s DA', 
    p_document_type, p_nfact, v_marge);
END;
$$;

-- ÉTAPE 6: Même chose pour les factures
-- Supprimer toutes les versions existantes de insert_fact_safe
DROP FUNCTION IF EXISTS insert_fact_safe(TEXT, INTEGER, TEXT, DATE, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS insert_fact_safe(TEXT, TEXT, TEXT, DATE, NUMERIC, NUMERIC) CASCADE;
DROP FUNCTION IF EXISTS insert_fact_safe CASCADE;

CREATE OR REPLACE FUNCTION insert_fact_safe(
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
  v_montant_ttc NUMERIC;
BEGIN
  -- Calculer le montant TTC
  v_montant_ttc := p_montant_ht + p_tva;
  
  -- Insérer la facture
  sql_query := format('
    INSERT INTO %I.fact (
      "NFact", "Nclient", date_fact, montant_ht, "TVA", timbre, autre_taxe,
      banq, ncheque, marge
    ) VALUES (
      %s, %L, %L, %s, %s, 0, 0,
      '''', '''', 0
    )',
    p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva
  );
  
  EXECUTE sql_query;
  
  -- Mettre à jour le CA du client
  PERFORM update_client_ca(p_tenant, p_nclient, v_montant_ttc, 'fact');
  
  RETURN format('Facture %s créée avec succès pour client %s (CA mis à jour)', p_nfact, p_nclient);
END;
$$;

-- ÉTAPE 7: Donner les permissions
GRANT EXECUTE ON FUNCTION calculate_document_margin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_client_ca TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_bl_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_document_margin TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_fact_safe TO anon, authenticated;

-- ============================================================================
-- NOTES D'UTILISATION:
-- ============================================================================
-- 1. Après avoir inséré tous les détails d'un BL, appelez:
--    SELECT update_document_margin('2009_bu02', 8706, 'bl');
--
-- 2. Le CA client est automatiquement mis à jour lors de l'insertion du BL/Facture
--
-- 3. La marge est calculée en comparant:
--    - Prix de vente (dans detail_bl/detail_fact)
--    - Prix d'achat (prix_unitaire dans article)
-- ============================================================================
