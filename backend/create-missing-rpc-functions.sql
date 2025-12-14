-- Créer les fonctions RPC manquantes dans la nouvelle base de données
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Fonction exec_sql (pour exécuter du SQL dynamique)
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
BEGIN
    EXECUTE sql;
    RETURN '{"success": true}'::JSON;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- 2. Fonction pour récupérer les articles par tenant
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS TABLE (
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
        SELECT 
            a.narticle,
            a.famille,
            a.designation,
            a.nfournisseur,
            a.prix_unitaire,
            a.marge,
            a.tva,
            a.prix_vente,
            a.seuil,
            a.stock_f,
            a.stock_bl
        FROM %I.article a
        ORDER BY a.narticle
    ', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- 3. Fonction pour récupérer les clients par tenant
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS TABLE (
    nclient VARCHAR(20),
    raison_sociale VARCHAR(100),
    adresse TEXT,
    contact_person VARCHAR(100),
    c_affaire_fact DECIMAL(15,2),
    c_affaire_bl DECIMAL(15,2),
    nrc VARCHAR(50),
    date_rc DATE,
    lieu_rc VARCHAR(100),
    i_fiscal VARCHAR(50),
    n_article VARCHAR(50),
    tel VARCHAR(20),
    email VARCHAR(100),
    commentaire TEXT
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT 
            c.nclient,
            c.raison_sociale,
            c.adresse,
            c.contact_person,
            c.c_affaire_fact,
            c.c_affaire_bl,
            c.nrc,
            c.date_rc,
            c.lieu_rc,
            c.i_fiscal,
            c.n_article,
            c.tel,
            c.email,
            c.commentaire
        FROM %I.client c
        ORDER BY c.nclient
    ', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- 4. Fonction pour récupérer les fournisseurs par tenant
CREATE OR REPLACE FUNCTION get_suppliers_by_tenant(p_tenant TEXT)
RETURNS TABLE (
    nfournisseur VARCHAR(20),
    nom_fournisseur VARCHAR(100),
    resp_fournisseur VARCHAR(100),
    adresse_fourni TEXT,
    tel VARCHAR(20),
    tel1 VARCHAR(20),
    tel2 VARCHAR(20),
    caf DECIMAL(15,2),
    cabl DECIMAL(15,2),
    email VARCHAR(100),
    commentaire TEXT
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT 
            f.nfournisseur,
            f.nom_fournisseur,
            f.resp_fournisseur,
            f.adresse_fourni,
            f.tel,
            f.tel1,
            f.tel2,
            f.caf,
            f.cabl,
            f.email,
            f.commentaire
        FROM %I.fournisseur f
        ORDER BY f.nfournisseur
    ', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- 5. Fonction pour insérer un article
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