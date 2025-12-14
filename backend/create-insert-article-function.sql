-- Fonction pour insérer un article - À EXÉCUTER DANS SUPABASE
-- Copiez ce code et exécutez-le dans Supabase SQL Editor

CREATE OR REPLACE FUNCTION insert_article_to_tenant(
    p_tenant TEXT,
    p_narticle VARCHAR(20),
    p_famille VARCHAR(50),
    p_designation VARCHAR(200),
    p_nfournisseur VARCHAR(20),
    p_prix_unitaire DECIMAL(15,2),
    p_marge DECIMAL(5,2),
    p_tva DECIMAL(5,2),
    p_prix_vente DECIMAL(15,2),
    p_seuil INTEGER,
    p_stock_f INTEGER,
    p_stock_bl INTEGER
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        INSERT INTO %I.article (
            narticle, famille, designation, nfournisseur,
            prix_unitaire, marge, tva, prix_vente,
            seuil, stock_f, stock_bl
        ) VALUES (
            %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
        )',
        p_tenant,
        p_narticle, p_famille, p_designation, p_nfournisseur,
        p_prix_unitaire, p_marge, p_tva, p_prix_vente,
        p_seuil, p_stock_f, p_stock_bl
    );
    
    RETURN 'Article inséré avec succès: ' || p_narticle;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;