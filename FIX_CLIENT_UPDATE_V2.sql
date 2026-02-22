-- FIX CLIENT UPDATE - Version 2
-- Le problème: la colonne s'appelle "Nclient" (avec majuscule) et non "nclient"

-- Recréer la fonction update_client_in_tenant avec le bon nom de colonne
CREATE OR REPLACE FUNCTION update_client_in_tenant(
    p_tenant TEXT,
    p_nclient TEXT,
    p_raison_sociale TEXT,
    p_adresse TEXT,
    p_contact_person TEXT,
    p_tel TEXT,
    p_email TEXT,
    p_nrc TEXT,
    p_i_fiscal TEXT,
    p_c_affaire_fact NUMERIC,
    p_c_affaire_bl NUMERIC
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $
BEGIN
    -- Utiliser directement "Nclient" avec majuscule et guillemets
    EXECUTE format('
        UPDATE %I.client SET
            "Raison_sociale" = $1,
            adresse = $2,
            contact_person = $3,
            "Tel" = $4,
            email = $5,
            "NRC" = $6,
            "I_Fiscal" = $7,
            "C_affaire_fact" = $8,
            "C_affaire_bl" = $9
        WHERE "Nclient" = $10',
        p_tenant
    ) USING 
        p_raison_sociale, p_adresse, p_contact_person,
        p_tel, p_email, p_nrc, p_i_fiscal,
        p_c_affaire_fact, p_c_affaire_bl, p_nclient;
    
    RETURN 'Client ' || p_nclient || ' modifié avec succès dans ' || p_tenant;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$;

-- Test rapide (optionnel - décommenter pour tester)
-- SELECT update_client_in_tenant(
--     '2009_bu02',
--     '6',
--     'TEST RAISON SOCIALE',
--     'TEST ADRESSE',
--     'TEST CONTACT',
--     '0123456789',
--     'test@email.com',
--     'NRC123',
--     'IF123',
--     1000.00,
--     2000.00
-- );
