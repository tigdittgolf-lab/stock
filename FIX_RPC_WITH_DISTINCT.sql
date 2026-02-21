-- Recréer la fonction get_articles_by_tenant avec DISTINCT pour éviter les doublons

DROP FUNCTION IF EXISTS get_articles_by_tenant(TEXT);

CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE format('
    SELECT json_agg(row_data)
    FROM (
      SELECT DISTINCT ON (t."Narticle") jsonb_build_object(
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
      ORDER BY t."Narticle", (t.stock_f + t.stock_bl) DESC, t.prix_vente DESC
    ) subquery', p_tenant)
  INTO result;
  RETURN COALESCE(result, '[]'::json);
END;
$$;

-- Tester la fonction avec l'article 6786
SELECT 
    elem->>'narticle' as code_article,
    elem->>'designation' as designation,
    elem->>'nfournisseur' as fournisseur,
    (elem->>'stock_f')::int + (elem->>'stock_bl')::int as stock_total
FROM json_array_elements(get_articles_by_tenant('2009_bu02')) as elem
WHERE elem->>'narticle' = '6786';

-- Compter les occurrences
SELECT 
    COUNT(*) as occurrences_article_6786
FROM json_array_elements(get_articles_by_tenant('2009_bu02')) as elem
WHERE elem->>'narticle' = '6786';

-- Vérifier le nombre total d'articles retournés
SELECT 
    json_array_length(get_articles_by_tenant('2009_bu02')) as total_articles_rpc;
