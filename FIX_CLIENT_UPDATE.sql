-- Vérifier la structure de la table client dans le schéma 2009_bu02
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = '2009_bu02' 
  AND table_name = 'client'
ORDER BY ordinal_position;

-- Si la colonne s'appelle différemment, créer une fonction qui utilise le bon nom
-- Recréer la fonction update_client_in_tenant avec gestion d'erreur améliorée

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
DECLARE
    v_sql TEXT;
    v_column_name TEXT;
BEGIN
    -- Détecter le nom de la colonne ID (nclient, code_client, id, etc.)
    SELECT column_name INTO v_column_name
    FROM information_schema.columns
    WHERE table_schema = p_tenant
      AND table_name = 'client'
      AND column_name IN ('nclient', 'code_client', 'id', 'client_id')
    LIMIT 1;
    
    IF v_column_name IS NULL THEN
        RETURN 'ERREUR: Impossible de trouver la colonne ID dans la table client';
    END IF;
    
    -- Construire et exécuter la requête UPDATE
    v_sql := format('
        UPDATE %I.client SET
            raison_sociale = $1,
            adresse = $2,
            contact_person = $3,
            tel = $4,
            email = $5,
            nrc = $6,
            i_fiscal = $7,
            c_affaire_fact = $8,
            c_affaire_bl = $9
        WHERE %I = $10',
        p_tenant, v_column_name
    );
    
    EXECUTE v_sql USING 
        p_raison_sociale, p_adresse, p_contact_person,
        p_tel, p_email, p_nrc, p_i_fiscal,
        p_c_affaire_fact, p_c_affaire_bl, p_nclient;
    
    RETURN 'Client modifié avec succès: ' || p_nclient || ' (colonne: ' || v_column_name || ')';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;
