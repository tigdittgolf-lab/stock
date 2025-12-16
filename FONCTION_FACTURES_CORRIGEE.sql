-- =====================================================
-- FONCTIONS RPC CORRIGÉES pour les factures
-- À exécuter dans l'éditeur SQL de Supabase
-- =====================================================

-- 1. Fonction corrigée pour la liste des factures
CREATE OR REPLACE FUNCTION get_fact_list_enriched(p_tenant TEXT) 
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
  
  -- Récupérer les factures avec conversion correcte des types
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nfact'', nfact,
        ''nclient'', nclient,
        ''date_fact'', date_fact,
        ''montant_ht'', CAST(montant_ht AS NUMERIC),
        ''tva'', CAST(tva AS NUMERIC),
        ''total_ttc'', CAST(montant_ht AS NUMERIC) + CAST(tva AS NUMERIC),
        ''created_at'', created_at
      )
    ) 
    FROM %I.fact 
    ORDER BY nfact DESC
  ', p_tenant) INTO result;
  
  RETURN COALESCE(result, '[]'::json);
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN '[]'::json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction corrigée pour récupérer une facture avec détails
CREATE OR REPLACE FUNCTION get_fact_with_details(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  fact_data JSON;
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
      WHERE table_schema = p_tenant AND table_name = 'fact'
  ) INTO table_exists;
  
  IF NOT table_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer la facture avec conversion des types
  EXECUTE format('
    SELECT json_build_object(
      ''nfact'', nfact,
      ''nclient'', nclient,
      ''date_fact'', date_fact,
      ''montant_ht'', CAST(montant_ht AS NUMERIC),
      ''tva'', CAST(tva AS NUMERIC),
      ''timbre'', CAST(COALESCE(timbre, ''0'') AS NUMERIC),
      ''autre_taxe'', CAST(COALESCE(autre_taxe, ''0'') AS NUMERIC),
      ''created_at'', created_at
    )
    FROM %I.fact 
    WHERE nfact = $1
  ', p_tenant) 
  USING p_nfact INTO fact_data;
  
  IF fact_data IS NULL THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer les détails avec enrichissement des articles
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''narticle'', d.narticle,
        ''designation'', COALESCE(a.designation, ''Article '' || d.narticle),
        ''qte'', CAST(d.qte AS NUMERIC),
        ''prix'', CAST(d.prix AS NUMERIC),
        ''tva'', CAST(d.tva AS NUMERIC),
        ''total_ligne'', CAST(d.qte AS NUMERIC) * CAST(d.prix AS NUMERIC)
      )
    ) 
    FROM %I.detail_fact d
    LEFT JOIN %I.article a ON d.narticle = a.narticle
    WHERE d.nfact = $1
  ', p_tenant, p_tenant) 
  USING p_nfact INTO details_data;
  
  -- Combiner les données
  SELECT json_build_object(
      'nfact', (fact_data->>'nfact')::INTEGER,
      'nclient', fact_data->>'nclient',
      'date_fact', fact_data->>'date_fact',
      'montant_ht', (fact_data->>'montant_ht')::NUMERIC,
      'tva', (fact_data->>'tva')::NUMERIC,
      'total_ttc', (fact_data->>'montant_ht')::NUMERIC + (fact_data->>'tva')::NUMERIC,
      'created_at', fact_data->>'created_at',
      'details', COALESCE(details_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction spécialisée pour le PDF avec toutes les données
CREATE OR REPLACE FUNCTION get_fact_for_pdf(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  schema_exists BOOLEAN;
BEGIN
  -- Vérifier si le schéma existe
  SELECT EXISTS(
      SELECT 1 FROM information_schema.schemata 
      WHERE schema_name = p_tenant
  ) INTO schema_exists;
  
  IF NOT schema_exists THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer toutes les données nécessaires pour le PDF en une seule requête
  EXECUTE format('
    SELECT json_build_object(
      ''nfact'', f.nfact,
      ''nclient'', f.nclient,
      ''date_fact'', f.date_fact,
      ''montant_ht'', CAST(f.montant_ht AS NUMERIC),
      ''tva'', CAST(f.tva AS NUMERIC),
      ''timbre'', CAST(COALESCE(f.timbre, ''0'') AS NUMERIC),
      ''autre_taxe'', CAST(COALESCE(f.autre_taxe, ''0'') AS NUMERIC),
      ''raison_sociale'', COALESCE(c.raison_sociale, ''Client '' || f.nclient),
      ''adresse'', COALESCE(c.adresse, ''''),
      ''nif'', COALESCE(c.i_fiscal, ''''),
      ''rc'', COALESCE(c.nrc, ''''),
      ''details'', COALESCE(
        (SELECT json_agg(
          json_build_object(
            ''narticle'', d.narticle,
            ''designation'', COALESCE(a.designation, ''Article '' || d.narticle),
            ''qte'', CAST(d.qte AS NUMERIC),
            ''prix'', CAST(d.prix AS NUMERIC),
            ''tva'', CAST(d.tva AS NUMERIC),
            ''total_ligne'', CAST(d.qte AS NUMERIC) * CAST(d.prix AS NUMERIC)
          )
        )
        FROM %I.detail_fact d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = f.nfact), ''[]''::json
      )
    )
    FROM %I.fact f
    LEFT JOIN %I.client c ON f.nclient = c.nclient
    WHERE f.nfact = $1
  ', p_tenant, p_tenant, p_tenant, p_tenant) 
  USING p_nfact INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_fact_list_enriched TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_with_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_for_pdf TO anon, authenticated;

-- Tests pour vérifier que tout fonctionne
-- SELECT get_fact_list_enriched('2025_bu01');
-- SELECT get_fact_with_details('2025_bu01', 1);
-- SELECT get_fact_for_pdf('2025_bu01', 1);