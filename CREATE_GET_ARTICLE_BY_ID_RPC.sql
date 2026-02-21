-- Créer la fonction RPC pour récupérer un article par ID

DROP FUNCTION IF EXISTS get_article_by_id_from_tenant(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_article_by_id_from_tenant(
  p_tenant TEXT,
  p_narticle TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT COALESCE(json_agg(row_data), ''[]''::json)
    FROM (
      SELECT jsonb_build_object(
        ''narticle'', t."Narticle",
        ''famille'', t.famille,
        ''designation'', t.designation,
        ''nfournisseur'', t."Nfournisseur",
        ''prix_unitaire'', t.prix_unitaire,
        ''marge'', t.marge,
        ''tva'', t.tva,
        ''prix_vente'', t.prix_vente,
        ''seuil'', t.seuil,
        ''stock_f'', t.stock_f,
        ''stock_bl'', t.stock_bl
      ) as row_data
      FROM "%s".article t
      WHERE t."Narticle" = $1
    ) subquery', p_tenant)
  USING p_narticle
  INTO result;
  
  RETURN result;
END;
$$;

-- Test avec un article existant (remplace par un vrai code article)
SELECT get_article_by_id_from_tenant('2009_bu02', '2662');

-- Vérifier que la fonction existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_article_by_id_from_tenant';
