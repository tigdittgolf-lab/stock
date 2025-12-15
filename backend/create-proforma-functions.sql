-- Fonctions RPC pour les Proformas
-- À exécuter dans Supabase SQL Editor

-- 1. Fonction pour obtenir le prochain numéro de proforma
CREATE OR REPLACE FUNCTION get_next_proforma_number_simple(p_tenant TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  next_number INTEGER;
BEGIN
  -- Vérifier que le tenant est fourni
  IF p_tenant IS NULL OR p_tenant = '' THEN
    RAISE EXCEPTION 'Tenant parameter is required';
  END IF;

  -- Obtenir le prochain numéro de proforma
  EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM %I.fprof', p_tenant) 
  INTO next_number;
  
  -- Si aucune proforma n'existe, commencer à 1
  IF next_number IS NULL THEN
    next_number := 1;
  END IF;
  
  RETURN next_number;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur (table n'existe pas, etc.), retourner 1
    RETURN 1;
END;
$$;

-- 2. Fonction pour insérer une proforma
CREATE OR REPLACE FUNCTION insert_proforma_simple(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_nclient TEXT,
  p_date_fact DATE,
  p_montant_ht DECIMAL,
  p_tva DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier que le tenant est fourni
  IF p_tenant IS NULL OR p_tenant = '' THEN
    RAISE EXCEPTION 'Tenant parameter is required';
  END IF;

  -- Insérer la proforma
  EXECUTE format('
    INSERT INTO %I.fprof (nfact, nclient, date_fact, montant_ht, tva, timbre, autre_taxe, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, 0, 0, NOW(), NOW())
  ', p_tenant) 
  USING p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva;

  -- Retourner le résultat
  result := json_build_object(
    'success', true,
    'nfact', p_nfact,
    'message', 'Proforma créée avec succès'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de la création de la proforma: %', SQLERRM;
END;
$$;

-- 3. Fonction pour insérer les détails de proforma
CREATE OR REPLACE FUNCTION insert_detail_proforma_simple(
  p_tenant TEXT,
  p_nfact INTEGER,
  p_narticle TEXT,
  p_qte DECIMAL,
  p_prix DECIMAL,
  p_tva DECIMAL,
  p_total_ligne DECIMAL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  -- Vérifier que le tenant est fourni
  IF p_tenant IS NULL OR p_tenant = '' THEN
    RAISE EXCEPTION 'Tenant parameter is required';
  END IF;

  -- Insérer le détail de proforma
  EXECUTE format('
    INSERT INTO %I.detail_fprof (nfact, narticle, qte, tva, prix, total_ligne, pr_achat)
    VALUES ($1, $2, $3, $4, $5, $6, 0)
  ', p_tenant) 
  USING p_nfact, p_narticle, p_qte, p_tva, p_prix, p_total_ligne;

  -- Retourner le résultat
  result := json_build_object(
    'success', true,
    'nfact', p_nfact,
    'narticle', p_narticle,
    'message', 'Détail proforma ajouté avec succès'
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Erreur lors de l''ajout du détail proforma: %', SQLERRM;
END;
$$;

-- 4. Fonction pour récupérer la liste des proformas
CREATE OR REPLACE FUNCTION get_proformas_by_tenant(p_tenant TEXT)
RETURNS TABLE(
  nfact INTEGER,
  nclient VARCHAR(20),
  date_fact DATE,
  montant_ht DECIMAL(15,2),
  tva DECIMAL(15,2),
  montant_ttc DECIMAL(15,2),
  created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier que le tenant est fourni
  IF p_tenant IS NULL OR p_tenant = '' THEN
    RAISE EXCEPTION 'Tenant parameter is required';
  END IF;

  -- Retourner la liste des proformas avec calcul du TTC
  RETURN QUERY EXECUTE format('
    SELECT 
      f.nfact,
      f.nclient,
      f.date_fact,
      f.montant_ht,
      f.tva,
      (f.montant_ht + f.tva) as montant_ttc,
      f.created_at
    FROM %I.fprof f
    ORDER BY f.nfact DESC
  ', p_tenant);

EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur (table n'existe pas, etc.), retourner une liste vide
    RETURN;
END;
$$;

-- 5. Fonction pour récupérer une proforma par ID avec ses détails
CREATE OR REPLACE FUNCTION get_proforma_by_id(
  p_tenant TEXT,
  p_nfact INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  proforma_record RECORD;
  details_json JSON;
  result JSON;
BEGIN
  -- Vérifier que le tenant est fourni
  IF p_tenant IS NULL OR p_tenant = '' THEN
    RAISE EXCEPTION 'Tenant parameter is required';
  END IF;

  -- Récupérer la proforma
  EXECUTE format('
    SELECT 
      f.nfact,
      f.nclient,
      f.date_fact,
      f.montant_ht,
      f.tva,
      (f.montant_ht + f.tva) as montant_ttc,
      f.created_at
    FROM %I.fprof f
    WHERE f.nfact = $1
  ', p_tenant) 
  INTO proforma_record USING p_nfact;

  -- Si la proforma n'existe pas
  IF proforma_record IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Proforma not found');
  END IF;

  -- Récupérer les détails
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''narticle'', d.narticle,
        ''qte'', d.qte,
        ''prix'', d.prix,
        ''tva'', d.tva,
        ''total_ligne'', d.total_ligne
      )
    )
    FROM %I.detail_fprof d
    WHERE d.nfact = $1
  ', p_tenant)
  INTO details_json USING p_nfact;

  -- Construire le résultat final
  result := json_build_object(
    'success', true,
    'data', json_build_object(
      'nfact', proforma_record.nfact,
      'nclient', proforma_record.nclient,
      'date_fact', proforma_record.date_fact,
      'montant_ht', proforma_record.montant_ht,
      'tva', proforma_record.tva,
      'montant_ttc', proforma_record.montant_ttc,
      'created_at', proforma_record.created_at,
      'details', COALESCE(details_json, '[]'::json)
    )
  );

  RETURN result;

EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_next_proforma_number_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_proforma_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION insert_detail_proforma_simple TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_proformas_by_tenant TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_proforma_by_id TO anon, authenticated;

-- Commentaires
COMMENT ON FUNCTION get_next_proforma_number_simple IS 'Obtient le prochain numéro de proforma pour un tenant';
COMMENT ON FUNCTION insert_proforma_simple IS 'Insère une nouvelle proforma dans le schéma tenant';
COMMENT ON FUNCTION insert_detail_proforma_simple IS 'Insère un détail de proforma dans le schéma tenant';
COMMENT ON FUNCTION get_proformas_by_tenant IS 'Récupère la liste des proformas pour un tenant';
COMMENT ON FUNCTION get_proforma_by_id IS 'Récupère une proforma par ID avec ses détails';