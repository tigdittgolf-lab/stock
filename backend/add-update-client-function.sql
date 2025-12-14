-- Ajouter la fonction de mise à jour de client - À EXÉCUTER DANS SUPABASE
-- Copiez ce code et exécutez-le dans Supabase SQL Editor

CREATE FUNCTION update_client_in_tenant(
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