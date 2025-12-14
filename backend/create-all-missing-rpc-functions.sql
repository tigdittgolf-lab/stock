-- TOUTES LES FONCTIONS RPC MANQUANTES POUR UN SYSTÈME COMPLET
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- 1. Fonction pour insérer un article
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
AS $
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
$;

-- 2. Fonction pour insérer un client
CREATE OR REPLACE FUNCTION insert_client_to_tenant(
    p_tenant TEXT,
    p_nclient VARCHAR(20),
    p_raison_sociale VARCHAR(100),
    p_adresse TEXT,
    p_contact_person VARCHAR(100),
    p_c_affaire_fact DECIMAL(15,2),
    p_c_affaire_bl DECIMAL(15,2),
    p_nrc VARCHAR(50),
    p_date_rc DATE,
    p_lieu_rc VARCHAR(100),
    p_i_fiscal VARCHAR(50),
    p_n_article VARCHAR(50),
    p_tel VARCHAR(20),
    p_email VARCHAR(100),
    p_commentaire TEXT
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        INSERT INTO %I.client (
            nclient, raison_sociale, adresse, contact_person,
            c_affaire_fact, c_affaire_bl, nrc, date_rc, lieu_rc,
            i_fiscal, n_article, tel, email, commentaire
        ) VALUES (
            %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
        )',
        p_tenant,
        p_nclient, p_raison_sociale, p_adresse, p_contact_person,
        p_c_affaire_fact, p_c_affaire_bl, p_nrc, p_date_rc, p_lieu_rc,
        p_i_fiscal, p_n_article, p_tel, p_email, p_commentaire
    );
    
    RETURN 'Client inséré avec succès: ' || p_nclient;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 3. Fonction pour modifier un article
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

-- 4. Fonction pour supprimer un article
CREATE OR REPLACE FUNCTION delete_article_from_tenant(
    p_tenant TEXT,
    p_narticle VARCHAR(20)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        DELETE FROM %I.article WHERE narticle = %L',
        p_tenant, p_narticle
    );
    
    RETURN 'Article supprimé avec succès: ' || p_narticle;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 5. Fonction pour modifier un client
CREATE OR REPLACE FUNCTION update_client_in_tenant(
    p_tenant TEXT,
    p_nclient VARCHAR(20),
    p_raison_sociale VARCHAR(100),
    p_adresse TEXT,
    p_contact_person VARCHAR(100),
    p_tel VARCHAR(20),
    p_email VARCHAR(100),
    p_commentaire TEXT
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        UPDATE %I.client SET
            raison_sociale = %L,
            adresse = %L,
            contact_person = %L,
            tel = %L,
            email = %L,
            commentaire = %L
        WHERE nclient = %L',
        p_tenant,
        p_raison_sociale, p_adresse, p_contact_person,
        p_tel, p_email, p_commentaire, p_nclient
    );
    
    RETURN 'Client modifié avec succès: ' || p_nclient;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 6. Fonction pour supprimer un client
CREATE OR REPLACE FUNCTION delete_client_from_tenant(
    p_tenant TEXT,
    p_nclient VARCHAR(20)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        DELETE FROM %I.client WHERE nclient = %L',
        p_tenant, p_nclient
    );
    
    RETURN 'Client supprimé avec succès: ' || p_nclient;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 7. Fonction pour modifier un fournisseur
CREATE OR REPLACE FUNCTION update_supplier_in_tenant(
    p_tenant TEXT,
    p_nfournisseur VARCHAR(20),
    p_nom_fournisseur VARCHAR(100),
    p_resp_fournisseur VARCHAR(100),
    p_adresse_fourni TEXT,
    p_tel VARCHAR(20),
    p_email VARCHAR(100),
    p_commentaire TEXT
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        UPDATE %I.fournisseur SET
            nom_fournisseur = %L,
            resp_fournisseur = %L,
            adresse_fourni = %L,
            tel = %L,
            email = %L,
            commentaire = %L
        WHERE nfournisseur = %L',
        p_tenant,
        p_nom_fournisseur, p_resp_fournisseur, p_adresse_fourni,
        p_tel, p_email, p_commentaire, p_nfournisseur
    );
    
    RETURN 'Fournisseur modifié avec succès: ' || p_nfournisseur;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 8. Fonction pour supprimer un fournisseur
CREATE OR REPLACE FUNCTION delete_supplier_from_tenant(
    p_tenant TEXT,
    p_nfournisseur VARCHAR(20)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        DELETE FROM %I.fournisseur WHERE nfournisseur = %L',
        p_tenant, p_nfournisseur
    );
    
    RETURN 'Fournisseur supprimé avec succès: ' || p_nfournisseur;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;