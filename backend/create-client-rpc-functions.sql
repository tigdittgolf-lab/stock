-- FONCTIONS RPC POUR LES CLIENTS - À EXÉCUTER DANS SUPABASE
-- Copiez tout ce code et exécutez-le dans Supabase SQL Editor

-- 1. Récupérer tous les clients
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS TABLE(
    nclient VARCHAR(20),
    raison_sociale VARCHAR(200),
    adresse TEXT,
    contact_person VARCHAR(100),
    tel VARCHAR(20),
    email VARCHAR(100),
    nrc VARCHAR(50),
    i_fiscal VARCHAR(50),
    c_affaire_fact DECIMAL(15,2),
    c_affaire_bl DECIMAL(15,2)
)
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT nclient, raison_sociale, adresse, contact_person,
               tel, email, nrc, i_fiscal,
               c_affaire_fact, c_affaire_bl
        FROM %I.client 
        ORDER BY nclient', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN;
END;
$$;

-- 2. Insérer un client
CREATE OR REPLACE FUNCTION insert_client_to_tenant(
    p_tenant TEXT,
    p_nclient VARCHAR(20),
    p_raison_sociale VARCHAR(200),
    p_adresse TEXT,
    p_contact_person VARCHAR(100),
    p_tel VARCHAR(20),
    p_email VARCHAR(100),
    p_nrc VARCHAR(50),
    p_i_fiscal VARCHAR(50),
    p_c_affaire_fact DECIMAL(15,2),
    p_c_affaire_bl DECIMAL(15,2)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        INSERT INTO %I.client (
            nclient, raison_sociale, adresse, contact_person,
            tel, email, nrc, i_fiscal,
            c_affaire_fact, c_affaire_bl
        ) VALUES (
            %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
        )',
        p_tenant,
        p_nclient, p_raison_sociale, p_adresse, p_contact_person,
        p_tel, p_email, p_nrc, p_i_fiscal,
        p_c_affaire_fact, p_c_affaire_bl
    );
    
    RETURN 'Client inséré avec succès: ' || p_nclient;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 3. Modifier un client
CREATE OR REPLACE FUNCTION update_client_in_tenant(
    p_tenant TEXT,
    p_nclient VARCHAR(20),
    p_raison_sociale VARCHAR(200),
    p_adresse TEXT,
    p_contact_person VARCHAR(100),
    p_tel VARCHAR(20),
    p_email VARCHAR(100),
    p_nrc VARCHAR(50),
    p_i_fiscal VARCHAR(50),
    p_c_affaire_fact DECIMAL(15,2),
    p_c_affaire_bl DECIMAL(15,2)
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
            nrc = %L,
            i_fiscal = %L,
            c_affaire_fact = %L,
            c_affaire_bl = %L
        WHERE nclient = %L',
        p_tenant,
        p_raison_sociale, p_adresse, p_contact_person,
        p_tel, p_email, p_nrc, p_i_fiscal,
        p_c_affaire_fact, p_c_affaire_bl, p_nclient
    );
    
    RETURN 'Client modifié avec succès: ' || p_nclient;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 4. Supprimer un client
CREATE OR REPLACE FUNCTION delete_client_from_tenant(
    p_tenant TEXT,
    p_nclient VARCHAR(20)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('DELETE FROM %I.client WHERE nclient = %L', p_tenant, p_nclient);
    RETURN 'Client supprimé avec succès: ' || p_nclient;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;