-- Supprimer l'ancienne version de la fonction
DROP FUNCTION IF EXISTS update_article_in_tenant(TEXT, VARCHAR, VARCHAR, VARCHAR, VARCHAR, DECIMAL, DECIMAL, DECIMAL, DECIMAL, INTEGER, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS update_article_in_tenant(TEXT, TEXT, TEXT, TEXT, TEXT, DECIMAL, DECIMAL, DECIMAL, DECIMAL, INTEGER, INTEGER, INTEGER);

-- Créer la fonction avec les bons noms de colonnes (majuscules) et le bon délimiteur
CREATE OR REPLACE FUNCTION update_article_in_tenant(
    p_tenant TEXT,
    p_narticle TEXT,
    p_famille TEXT,
    p_designation TEXT,
    p_nfournisseur TEXT,
    p_prix_unitaire DECIMAL(15,2),
    p_marge DECIMAL(5,2),
    p_tva DECIMAL(5,2),
    p_prix_vente DECIMAL(15,2),
    p_seuil INTEGER,
    p_stock_f INTEGER,
    p_stock_bl INTEGER
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    -- Mettre à jour l'article avec les noms de colonnes en MAJUSCULES
    EXECUTE format('
        UPDATE "%s".article SET
            famille = $1,
            designation = $2,
            "Nfournisseur" = $3,
            prix_unitaire = $4,
            marge = $5,
            tva = $6,
            prix_vente = $7,
            seuil = $8,
            stock_f = $9,
            stock_bl = $10
        WHERE "Narticle" = $11',
        p_tenant
    )
    USING p_famille, p_designation, p_nfournisseur,
          p_prix_unitaire, p_marge, p_tva, p_prix_vente,
          p_seuil, p_stock_f, p_stock_bl, p_narticle;
    
    -- Retourner l'article mis à jour
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
        ) subquery',
        p_tenant
    )
    USING p_narticle
    INTO result;
    
    RETURN result;
END;
$$;

-- Test de la fonction avec l'article 2662
SELECT update_article_in_tenant(
    '2009_bu02',
    '2662',
    'Droguerie',
    'TEST MODIFICATION',
    NULL,
    100.00,
    20.00,
    19.00,
    142.80,
    10,
    50,
    0
);

-- Vérifier que la modification a été appliquée
SELECT get_article_by_id_from_tenant('2009_bu02', '2662');

-- Vérifier que la fonction existe
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'update_article_in_tenant';
