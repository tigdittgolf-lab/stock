-- FIX CLIENT UPDATE - Version 3 - NETTOYAGE COMPLET
-- Problème: Il existe plusieurs versions de la fonction avec des signatures différentes

-- ÉTAPE 1: Supprimer TOUTES les versions existantes de la fonction
DROP FUNCTION IF EXISTS update_client_in_tenant(text, varchar, varchar, text, varchar, varchar, varchar, varchar, varchar, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS update_client_in_tenant(text, text, text, text, text, text, text, text, text, numeric, numeric) CASCADE;
DROP FUNCTION IF EXISTS update_client_in_tenant CASCADE;

-- ÉTAPE 2: Créer UNE SEULE version propre avec les bons noms de colonnes
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
AS $$
BEGIN
    -- Utiliser les noms de colonnes avec la bonne casse (majuscules)
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
$$;

-- ÉTAPE 3: Vérifier qu'il n'existe qu'une seule version
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'update_client_in_tenant'
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Si vous voyez plusieurs lignes ci-dessus, il faut les supprimer manuellement dans l'éditeur SQL de Supabase
