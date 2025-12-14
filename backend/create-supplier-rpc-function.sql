-- Fonction RPC pour insérer un fournisseur dans la base de données
-- Exécutez ce script dans l'éditeur SQL de Supabase

CREATE OR REPLACE FUNCTION insert_supplier_to_tenant(
    p_tenant TEXT,
    p_nfournisseur VARCHAR(20),
    p_nom_fournisseur VARCHAR(100),
    p_resp_fournisseur VARCHAR(100),
    p_adresse_fourni TEXT,
    p_tel VARCHAR(20),
    p_tel1 VARCHAR(20),
    p_tel2 VARCHAR(20),
    p_caf DECIMAL(15,2),
    p_cabl DECIMAL(15,2),
    p_email VARCHAR(100),
    p_commentaire TEXT
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        INSERT INTO %I.fournisseur (
            nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni,
            tel, tel1, tel2, caf, cabl, email, commentaire
        ) VALUES (
            %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
        )',
        p_tenant,
        p_nfournisseur, p_nom_fournisseur, p_resp_fournisseur, p_adresse_fourni,
        p_tel, p_tel1, p_tel2, p_caf, p_cabl, p_email, p_commentaire
    );
    
    RETURN 'Fournisseur inséré avec succès: ' || p_nfournisseur;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;