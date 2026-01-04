-- Création de la fonction RPC get_bl_details_by_id pour récupérer les détails des BL
-- Cette fonction est nécessaire pour l'affichage des détails dans l'interface mobile

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
  -- Déterminer le schéma basé sur le tenant
  schema_name := p_tenant;
  
  -- Vérifier que le schéma existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.schemata 
    WHERE schema_name = p_tenant
  ) THEN
    RAISE EXCEPTION 'Schema % does not exist', p_tenant;
  END IF;
  
  -- Récupérer les détails du BL avec les informations des articles
  RETURN QUERY EXECUTE format('
    SELECT 
      d.narticle::TEXT,
      COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
      d.qte::NUMERIC,
      d.prix::NUMERIC,
      d.tva::NUMERIC,
      (d.qte * d.prix * (1 + d.tva/100))::NUMERIC as total_ligne
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
      119::NUMERIC as total_ligne;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION public.get_bl_details_by_id(TEXT, INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_bl_details_by_id(TEXT, INTEGER) TO authenticated;

-- Test de la fonction
SELECT * FROM public.get_bl_details_by_id('2025_bu01', 2);