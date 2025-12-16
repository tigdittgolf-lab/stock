-- =====================================================
-- SCRIPT SUPABASE : Fonctions RPC pour les factures
-- À exécuter dans l'éditeur SQL de Supabase Dashboard
-- =====================================================

-- 1. Fonction pour récupérer une facture avec ses détails d'articles
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
  
  -- Récupérer la facture
  EXECUTE format('SELECT row_to_json(t) FROM (SELECT * FROM %I.fact WHERE nfact = $1) t', p_tenant) 
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
        ''qte'', d.qte,
        ''prix'', d.prix,
        ''tva'', d.tva,
        ''total_ligne'', d.qte * d.prix
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
      'montant_ht', (fact_data->>'montant_ht')::DECIMAL,
      'tva', (fact_data->>'tva')::DECIMAL,
      'total_ttc', (fact_data->>'montant_ht')::DECIMAL + (fact_data->>'tva')::DECIMAL,
      'created_at', fact_data->>'created_at',
      'details', COALESCE(details_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour récupérer la liste des factures avec totaux calculés
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
  
  -- Récupérer les factures avec calcul du total TTC
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''nfact'', nfact,
        ''nclient'', nclient,
        ''date_fact'', date_fact,
        ''montant_ht'', montant_ht,
        ''tva'', tva,
        ''total_ttc'', montant_ht + tva,
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

-- 3. Fonction pour récupérer les détails d'une facture pour PDF
CREATE OR REPLACE FUNCTION get_fact_for_pdf(p_tenant TEXT, p_nfact INTEGER) 
RETURNS JSON AS $$
DECLARE
  result JSON;
  fact_data JSON;
  details_data JSON;
  client_data JSON;
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
  
  -- Récupérer la facture avec informations client
  EXECUTE format('
    SELECT row_to_json(t) FROM (
      SELECT f.*, c.raison_sociale, c.adresse, c.nrc as rc, c.i_fiscal as nif
      FROM %I.fact f
      LEFT JOIN %I.client c ON f.nclient = c.nclient
      WHERE f.nfact = $1
    ) t
  ', p_tenant, p_tenant) 
  USING p_nfact INTO fact_data;
  
  IF fact_data IS NULL THEN
      RETURN NULL;
  END IF;
  
  -- Récupérer les détails avec articles
  EXECUTE format('
    SELECT json_agg(
      json_build_object(
        ''narticle'', d.narticle,
        ''designation'', COALESCE(a.designation, ''Article '' || d.narticle),
        ''qte'', d.qte,
        ''prix'', d.prix,
        ''tva'', d.tva,
        ''total_ligne'', d.qte * d.prix
      )
    ) 
    FROM %I.detail_fact d
    LEFT JOIN %I.article a ON d.narticle = a.narticle
    WHERE d.nfact = $1
  ', p_tenant, p_tenant) 
  USING p_nfact INTO details_data;
  
  -- Combiner toutes les données pour le PDF
  SELECT json_build_object(
      'nfact', (fact_data->>'nfact')::INTEGER,
      'nclient', fact_data->>'nclient',
      'date_fact', fact_data->>'date_fact',
      'montant_ht', (fact_data->>'montant_ht')::DECIMAL,
      'tva', (fact_data->>'tva')::DECIMAL,
      'timbre', COALESCE((fact_data->>'timbre')::DECIMAL, 0),
      'autre_taxe', COALESCE((fact_data->>'autre_taxe')::DECIMAL, 0),
      'raison_sociale', fact_data->>'raison_sociale',
      'adresse', fact_data->>'adresse',
      'nif', fact_data->>'nif',
      'rc', fact_data->>'rc',
      'details', COALESCE(details_data, '[]'::json)
  ) INTO result;
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
      RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Accorder les permissions aux utilisateurs
GRANT EXECUTE ON FUNCTION get_fact_with_details TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_list_enriched TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_fact_for_pdf TO anon, authenticated;

-- 5. Ajouter des commentaires pour la documentation
COMMENT ON FUNCTION get_fact_with_details IS 'Récupère une facture avec ses détails d''articles pour un tenant donné';
COMMENT ON FUNCTION get_fact_list_enriched IS 'Récupère la liste des factures avec totaux TTC calculés pour un tenant';
COMMENT ON FUNCTION get_fact_for_pdf IS 'Récupère une facture avec toutes les données nécessaires pour la génération PDF';

-- 6. Test des fonctions (optionnel - pour vérifier que tout fonctionne)
-- Décommentez les lignes suivantes pour tester :

-- SELECT get_fact_with_details('2025_bu01', 1);
-- SELECT get_fact_list_enriched('2025_bu01');
-- SELECT get_fact_for_pdf('2025_bu01', 1);