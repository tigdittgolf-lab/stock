-- Script pour créer les fonctions RPC Supabase pour les proformas
-- À exécuter dans l'éditeur SQL de Supabase

-- ===== FONCTION: get_proforma_list =====
-- Récupère la liste des proformas pour un tenant donné
CREATE OR REPLACE FUNCTION get_proforma_list(p_tenant TEXT)
RETURNS TABLE (
  nfact INTEGER,
  nclient TEXT,
  client_name TEXT,
  date_fact DATE,
  montant_ht DECIMAL,
  tva DECIMAL,
  montant_ttc DECIMAL,
  created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Vérifier si le schéma tenant existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = p_tenant
  ) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', p_tenant;
  END IF;

  -- Retourner les proformas avec les noms des clients
  RETURN QUERY EXECUTE format('
    SELECT 
      f.nfact,
      f.nclient,
      COALESCE(c.nom, c.nom_client, f.nclient) as client_name,
      f.date_fact,
      f.montant_ht,
      f.tva,
      (f.montant_ht + f.tva) as montant_ttc,
      f.created_at
    FROM %I.fprof f
    LEFT JOIN %I.client c ON f.nclient = c.nclient
    ORDER BY f.nfact DESC
  ', p_tenant, p_tenant);
END;
$$;

-- ===== FONCTION: get_proforma_by_id =====
-- Récupère une proforma spécifique avec ses détails
CREATE OR REPLACE FUNCTION get_proforma_by_id(p_tenant TEXT, p_nfact INTEGER)
RETURNS TABLE (
  nfact INTEGER,
  nclient TEXT,
  client_name TEXT,
  date_fact DATE,
  montant_ht DECIMAL,
  tva DECIMAL,
  montant_ttc DECIMAL,
  created_at TIMESTAMP,
  details JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  proforma_record RECORD;
  details_json JSONB;
BEGIN
  -- Vérifier si le schéma tenant existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = p_tenant
  ) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', p_tenant;
  END IF;

  -- Récupérer la proforma
  EXECUTE format('
    SELECT 
      f.nfact,
      f.nclient,
      COALESCE(c.nom, c.nom_client, f.nclient) as client_name,
      f.date_fact,
      f.montant_ht,
      f.tva,
      (f.montant_ht + f.tva) as montant_ttc,
      f.created_at
    FROM %I.fprof f
    LEFT JOIN %I.client c ON f.nclient = c.nclient
    WHERE f.nfact = $1
  ', p_tenant, p_tenant)
  INTO proforma_record
  USING p_nfact;

  -- Si la proforma n'existe pas
  IF proforma_record IS NULL THEN
    RAISE EXCEPTION 'Proforma % not found in tenant %', p_nfact, p_tenant;
  END IF;

  -- Récupérer les détails de la proforma
  EXECUTE format('
    SELECT COALESCE(
      jsonb_agg(
        jsonb_build_object(
          ''narticle'', d.narticle,
          ''designation'', COALESCE(a.designation, ''Article '' || d.narticle),
          ''qte'', d.qte,
          ''prix'', d.prix,
          ''total_ligne'', d.total_ligne
        )
      ), 
      ''[]''::jsonb
    )
    FROM %I.detail_fprof d
    LEFT JOIN %I.article a ON d.narticle = a.narticle
    WHERE d.nfact = $1
  ', p_tenant, p_tenant)
  INTO details_json
  USING p_nfact;

  -- Retourner le résultat
  RETURN QUERY SELECT 
    proforma_record.nfact,
    proforma_record.nclient,
    proforma_record.client_name,
    proforma_record.date_fact,
    proforma_record.montant_ht,
    proforma_record.tva,
    proforma_record.montant_ttc,
    proforma_record.created_at,
    details_json;
END;
$$;

-- ===== FONCTION: get_next_proforma_number =====
-- Récupère le prochain numéro de proforma disponible
CREATE OR REPLACE FUNCTION get_next_proforma_number(p_tenant TEXT)
RETURNS TABLE (next_number INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  max_number INTEGER;
BEGIN
  -- Vérifier si le schéma tenant existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = p_tenant
  ) THEN
    RAISE EXCEPTION 'Tenant schema % does not exist', p_tenant;
  END IF;

  -- Récupérer le numéro maximum
  EXECUTE format('
    SELECT COALESCE(MAX(nfact), 0) + 1
    FROM %I.fprof
  ', p_tenant)
  INTO max_number;

  RETURN QUERY SELECT max_number;
END;
$$;

-- ===== PERMISSIONS =====
-- Donner les permissions nécessaires
GRANT EXECUTE ON FUNCTION get_proforma_list(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_proforma_by_id(TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_next_proforma_number(TEXT) TO authenticated, anon;

-- ===== INSTRUCTIONS =====
/*
INSTRUCTIONS POUR UTILISER CES FONCTIONS :

1. Copiez tout ce script SQL
2. Allez dans votre dashboard Supabase : https://szgodrjglbpzkrksnroi.supabase.co
3. Cliquez sur "SQL Editor" dans le menu de gauche
4. Collez ce script dans l'éditeur
5. Cliquez sur "Run" pour exécuter

TESTS :
- Test liste : SELECT * FROM get_proforma_list('2025_bu01');
- Test détail : SELECT * FROM get_proforma_by_id('2025_bu01', 1);
- Test numéro : SELECT * FROM get_next_proforma_number('2025_bu01');

PRÉREQUIS :
- Les schémas tenant (ex: 2025_bu01) doivent exister
- Les tables fprof, detail_fprof, client, article doivent exister dans ces schémas
*/