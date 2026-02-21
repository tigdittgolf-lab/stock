-- Supprimer TOUTES les versions de la fonction get_article_by_id_from_tenant
DROP FUNCTION IF EXISTS get_article_by_id_from_tenant(TEXT, TEXT);
DROP FUNCTION IF EXISTS get_article_by_id_from_tenant(TEXT, VARCHAR);
DROP FUNCTION IF EXISTS get_article_by_id_from_tenant(TEXT, CHARACTER VARYING);

-- Recréer UNE SEULE version avec TEXT pour les deux paramètres
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

-- Vérifier qu'il n'y a plus qu'UNE SEULE version
SELECT 
    routine_name,
    routine_type,
    data_type,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_article_by_id_from_tenant';

-- Test avec l'article 2662
SELECT get_article_by_id_from_tenant('2009_bu02', '2662');
