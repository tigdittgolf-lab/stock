-- Fonction corrigée pour gérer les espaces dans les IDs
-- À EXÉCUTER DANS SUPABASE SQL EDITOR

CREATE OR REPLACE FUNCTION get_article_by_id_from_tenant(
    p_tenant TEXT,
    p_narticle VARCHAR(20)
)
RETURNS TABLE(
    narticle VARCHAR(20),
    famille VARCHAR(50),
    designation VARCHAR(200),
    nfournisseur VARCHAR(20),
    prix_unitaire DECIMAL(15,2),
    marge DECIMAL(5,2),
    tva DECIMAL(5,2),
    prix_vente DECIMAL(15,2),
    seuil INTEGER,
    stock_f INTEGER,
    stock_bl INTEGER
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Utiliser TRIM pour ignorer les espaces dans la comparaison
    RETURN QUERY EXECUTE format('
        SELECT narticle, famille, designation, nfournisseur,
               prix_unitaire, marge, tva, prix_vente,
               seuil, stock_f, stock_bl
        FROM %I.article 
        WHERE TRIM(narticle) = TRIM(%L)',
        p_tenant, p_narticle
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;