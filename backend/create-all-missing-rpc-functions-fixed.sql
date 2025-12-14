-- TOUTES LES FONCTIONS RPC NÉCESSAIRES - À EXÉCUTER DANS SUPABASE
-- Copiez tout ce code et exécutez-le dans Supabase SQL Editor

-- ========================================
-- FONCTIONS POUR LES ARTICLES
-- ========================================

-- 1. Récupérer tous les articles
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
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
    RETURN QUERY EXECUTE format('
        SELECT narticle, famille, designation, nfournisseur,
               prix_unitaire, marge, tva, prix_vente,
               seuil, stock_f, stock_bl
        FROM %I.article 
        ORDER BY narticle', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- 2. Récupérer un article spécifique par ID
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
    RETURN QUERY EXECUTE format('
        SELECT narticle, famille, designation, nfournisseur,
               prix_unitaire, marge, tva, prix_vente,
               seuil, stock_f, stock_bl
        FROM %I.article 
        WHERE narticle = %L',
        p_tenant, p_narticle
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- 3. Insérer un article
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

-- 4. Modifier un article
CREATE OR REPLACE FUNCTION update_article_in_tenant(
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
        UPDATE %I.article SET
            famille = %L,
            designation = %L,
            nfournisseur = %L,
            prix_unitaire = %L,
            marge = %L,
            tva = %L,
            prix_vente = %L,
            seuil = %L,
            stock_f = %L,
            stock_bl = %L
        WHERE narticle = %L',
        p_tenant,
        p_famille, p_designation, p_nfournisseur,
        p_prix_unitaire, p_marge, p_tva, p_prix_vente,
        p_seuil, p_stock_f, p_stock_bl, p_narticle
    );
    
    RETURN 'Article modifié avec succès: ' || p_narticle;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 5. Supprimer un article
CREATE OR REPLACE FUNCTION delete_article_from_tenant(
    p_tenant TEXT,
    p_narticle VARCHAR(20)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('DELETE FROM %I.article WHERE narticle = %L', p_tenant, p_narticle);
    RETURN 'Article supprimé avec succès: ' || p_narticle;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- ========================================
-- FONCTIONS POUR LES FAMILLES
-- ========================================

-- 1. Récupérer les familles
CREATE OR REPLACE FUNCTION get_families_by_tenant(p_tenant TEXT)
RETURNS TABLE(famille VARCHAR(50))
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('SELECT famille FROM %I.famille_art ORDER BY famille', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- 2. Créer une famille
CREATE OR REPLACE FUNCTION insert_family_to_tenant(
    p_tenant TEXT,
    p_famille VARCHAR(50)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('INSERT INTO %I.famille_art (famille) VALUES (%L)', p_tenant, p_famille);
    RETURN 'Famille créée avec succès: ' || p_famille;
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'ERREUR: La famille "' || p_famille || '" existe déjà';
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 3. Modifier une famille
CREATE OR REPLACE FUNCTION update_family_in_tenant(
    p_tenant TEXT,
    p_old_famille VARCHAR(50),
    p_new_famille VARCHAR(50)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mettre à jour la famille
    EXECUTE format('UPDATE %I.famille_art SET famille = %L WHERE famille = %L', 
                   p_tenant, p_new_famille, p_old_famille);
    
    -- Mettre à jour les articles qui utilisent cette famille
    EXECUTE format('UPDATE %I.article SET famille = %L WHERE famille = %L', 
                   p_tenant, p_new_famille, p_old_famille);
    
    RETURN 'Famille modifiée avec succès: ' || p_old_famille || ' → ' || p_new_famille;
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'ERREUR: La famille "' || p_new_famille || '" existe déjà';
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 4. Supprimer une famille
CREATE OR REPLACE FUNCTION delete_family_from_tenant(
    p_tenant TEXT,
    p_famille VARCHAR(50)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    article_count INTEGER;
BEGIN
    -- Vérifier si des articles utilisent cette famille
    EXECUTE format('SELECT COUNT(*) FROM %I.article WHERE famille = %L', p_tenant, p_famille)
    INTO article_count;
    
    IF article_count > 0 THEN
        RETURN 'ERREUR: Impossible de supprimer la famille "' || p_famille || '". ' || 
               article_count || ' article(s) l''utilisent encore.';
    END IF;
    
    -- Supprimer la famille
    EXECUTE format('DELETE FROM %I.famille_art WHERE famille = %L', p_tenant, p_famille);
    
    RETURN 'Famille supprimée avec succès: ' || p_famille;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;