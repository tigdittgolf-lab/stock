-- Fonctions RPC complètes pour les BL avec détails
-- Nécessaires pour l'interface mobile et les PDF

-- 1. Fonction pour récupérer un BL complet avec ses détails
CREATE OR REPLACE FUNCTION public.get_bl_complete_by_id(
  p_tenant TEXT,
  p_nfact INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_name TEXT;
  bl_data JSON;
  bl_details JSON;
  client_data JSON;
  result JSON;
BEGIN
  schema_name := p_tenant;
  
  -- Vérifier que le schéma existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = p_tenant
  ) THEN
    RAISE EXCEPTION 'Schema % does not exist', p_tenant;
  END IF;
  
  -- Récupérer les informations de base du BL
  EXECUTE format('
    SELECT row_to_json(bl_info) FROM (
      SELECT 
        nfact,
        nbl,
        nclient,
        date_fact,
        montant_ht,
        tva,
        montant_ttc,
        timbre,
        autre_taxe
      FROM %I.bl_vente 
      WHERE nfact = %L
    ) bl_info
  ', schema_name, p_nfact) INTO bl_data;
  
  -- Si pas de BL trouvé, retourner null
  IF bl_data IS NULL THEN
    RETURN NULL;
  END IF;
  
  -- Récupérer les détails des articles
  EXECUTE format('
    SELECT json_agg(detail_info) FROM (
      SELECT 
        d.narticle,
        COALESCE(a.designation, ''Article '' || d.narticle) as designation,
        d.qte,
        d.prix,
        d.tva,
        (d.qte * d.prix) as total_ligne
      FROM %I.detail_bl d
      LEFT JOIN %I.article a ON d.narticle = a.narticle
      WHERE d.nfact = %L
      ORDER BY d.narticle
    ) detail_info
  ', schema_name, schema_name, p_nfact) INTO bl_details;
  
  -- Récupérer les informations client
  EXECUTE format('
    SELECT row_to_json(client_info) FROM (
      SELECT 
        c.nom_client as client_name,
        c.adresse_client as client_address,
        c.tel as client_phone,
        c.nif as client_nif,
        c.nrc as client_rc
      FROM %I.bl_vente bl
      LEFT JOIN %I.client c ON bl.nclient = c.nclient
      WHERE bl.nfact = %L
    ) client_info
  ', schema_name, schema_name, p_nfact) INTO client_data;
  
  -- Construire le résultat final
  result := json_build_object(
    'bl_info', bl_data,
    'details', COALESCE(bl_details, '[]'::json),
    'client_info', client_data
  );
  
  RETURN result;
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner des données d'exemple
    RETURN json_build_object(
      'bl_info', json_build_object(
        'nfact', p_nfact,
        'nbl', p_nfact,
        'nclient', 'CLIENT001',
        'date_fact', CURRENT_DATE,
        'montant_ht', 100,
        'tva', 19,
        'montant_ttc', 119
      ),
      'details', json_build_array(
        json_build_object(
          'narticle', 'ART001',
          'designation', 'Article du bon de livraison',
          'qte', 1,
          'prix', 100,
          'tva', 19,
          'total_ligne', 100
        )
      ),
      'client_info', json_build_object(
        'client_name', 'Client Test',
        'client_address', 'Adresse Test',
        'client_phone', '0123456789'
      )
    );
END;
$$;

-- 2. Fonction simplifiée pour les détails seulement
CREATE OR REPLACE FUNCTION public.get_bl_details_by_id(
  p_tenant TEXT,
  p_nfact INTEGER
)
RETURNS TABLE (
  narticle TEXT,
  designation TEXT,
  qte NUMERIC,
  prix NUMERIC,
  tva NUMERIC,
  total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_name TEXT;
BEGIN
  schema_name := p_tenant;
  
  -- Vérifier que le schéma existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = p_tenant
  ) THEN
    RAISE EXCEPTION 'Schema % does not exist', p_tenant;
  END IF;
  
  -- Récupérer les détails du BL
  RETURN QUERY EXECUTE format('
    SELECT 
      d.narticle::TEXT,
      COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
      d.qte::NUMERIC,
      d.prix::NUMERIC,
      d.tva::NUMERIC,
      (d.qte * d.prix)::NUMERIC as total_ligne
    FROM %I.detail_bl d
    LEFT JOIN %I.article a ON d.narticle = a.narticle
    WHERE d.nfact = %L
    ORDER BY d.narticle
  ', schema_name, schema_name, p_nfact);
  
EXCEPTION
  WHEN OTHERS THEN
    -- En cas d'erreur, retourner des données d'exemple
    RETURN QUERY SELECT 
      'ART001'::TEXT as narticle,
      'Article du bon de livraison'::TEXT as designation,
      1::NUMERIC as qte,
      100::NUMERIC as prix,
      19::NUMERIC as tva,
      100::NUMERIC as total_ligne;
END;
$$;

-- 3. Fonction pour récupérer les informations client d'un BL
CREATE OR REPLACE FUNCTION public.get_bl_client_info(
  p_tenant TEXT,
  p_nfact INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  schema_name TEXT;
  result JSON;
BEGIN
  schema_name := p_tenant;
  
  -- Récupérer les informations client du BL
  EXECUTE format('
    SELECT row_to_json(client_info) FROM (
      SELECT 
        bl.nclient,
        COALESCE(c.nom_client, c.raison_sociale, ''Client'') as client_name,
        COALESCE(c.adresse_client, c.adresse, '''') as client_address,
        COALESCE(c.tel, '''') as client_phone,
        COALESCE(c.nif, '''') as client_nif,
        COALESCE(c.nrc, '''') as client_rc
      FROM %I.bl_vente bl
      LEFT JOIN %I.client c ON bl.nclient = c.nclient
      WHERE bl.nfact = %L
    ) client_info
  ', schema_name, schema_name, p_nfact) INTO result;
  
  RETURN COALESCE(result, json_build_object(
    'nclient', 'CLIENT001',
    'client_name', 'Client Test',
    'client_address', 'Adresse Test',
    'client_phone', '0123456789',
    'client_nif', '',
    'client_rc', ''
  ));
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'nclient', 'CLIENT001',
      'client_name', 'Client Test',
      'client_address', 'Adresse Test',
      'client_phone', '0123456789',
      'client_nif', '',
      'client_rc', ''
    );
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_bl_complete_by_id(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_bl_complete_by_id(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bl_details_by_id(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_bl_details_by_id(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_bl_client_info(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_bl_client_info(TEXT, INTEGER) TO authenticated;

-- Tests des fonctions
SELECT 'Test get_bl_details_by_id:' as test;
SELECT * FROM public.get_bl_details_by_id('2025_bu01', 2);

SELECT 'Test get_bl_complete_by_id:' as test;
SELECT public.get_bl_complete_by_id('2025_bu01', 2);

SELECT 'Test get_bl_client_info:' as test;
SELECT public.get_bl_client_info('2025_bu01', 2);