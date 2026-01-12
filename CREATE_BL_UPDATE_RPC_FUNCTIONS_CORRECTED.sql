-- Fonctions RPC corrigées pour la modification des BL (format schéma.table)

-- 1. Fonction pour mettre à jour un BL
CREATE OR REPLACE FUNCTION update_bl(
    p_tenant TEXT,
    p_nfact INTEGER,
    p_nclient TEXT,
    p_date_fact DATE,
    p_montant_ht DECIMAL(10,2),
    p_tva DECIMAL(10,2),
    p_montant_ttc DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
    update_query TEXT;
    result_count INTEGER;
BEGIN
    -- Construire la requête de mise à jour avec le format schéma.table
    update_query := format('
        UPDATE %I.bl 
        SET nclient = $1,
            date_fact = $2,
            montant_ht = $3,
            tva = $4
        WHERE nfact = $5',
        p_tenant
    );
    
    -- Exécuter la mise à jour
    EXECUTE update_query 
    USING p_nclient, p_date_fact, p_montant_ht, p_tva, p_nfact;
    
    -- Vérifier le nombre de lignes affectées
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    IF result_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'BL not found or not updated'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'BL updated successfully',
        'updated_count', result_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error updating BL: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour supprimer les détails d'un BL
CREATE OR REPLACE FUNCTION delete_bl_details(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS JSON AS $$
DECLARE
    delete_query TEXT;
    result_count INTEGER;
BEGIN
    -- Construire la requête de suppression avec le format schéma.table
    delete_query := format('DELETE FROM %I.detail_bl WHERE nfact = $1', p_tenant);
    
    -- Exécuter la suppression
    EXECUTE delete_query USING p_nfact;
    
    -- Vérifier le nombre de lignes supprimées
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', 'BL details deleted successfully',
        'deleted_count', result_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error deleting BL details: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour insérer un détail de BL
CREATE OR REPLACE FUNCTION insert_bl_detail(
    p_tenant TEXT,
    p_nfact INTEGER,
    p_narticle TEXT,
    p_qte DECIMAL(10,2),
    p_prix DECIMAL(10,2),
    p_tva DECIMAL(5,2),
    p_total_ligne DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
    insert_query TEXT;
BEGIN
    -- Construire la requête d'insertion avec le format schéma.table
    insert_query := format('
        INSERT INTO %I.detail_bl (nfact, narticle, qte, prix, tva, total_ligne)
        VALUES ($1, $2, $3, $4, $5, $6)',
        p_tenant
    );
    
    -- Exécuter l'insertion
    EXECUTE insert_query 
    USING p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
    
    RETURN json_build_object(
        'success', true,
        'message', 'BL detail inserted successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error inserting BL detail: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour supprimer les détails d'un BL
CREATE OR REPLACE FUNCTION delete_bl_details(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS JSON AS $$
DECLARE
    delete_query TEXT;
    result_count INTEGER;
BEGIN
    -- Construire la requête de suppression avec le format schéma.table
    delete_query := format('DELETE FROM %I.detail_bl WHERE nfact = $1', p_tenant);
    
    -- Exécuter la suppression
    EXECUTE delete_query USING p_nfact;
    
    -- Vérifier le nombre de lignes supprimées
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', 'BL details deleted successfully',
        'deleted_count', result_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error deleting BL details: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour insérer un détail de BL
CREATE OR REPLACE FUNCTION insert_bl_detail(
    p_tenant TEXT,
    p_nfact INTEGER,
    p_narticle TEXT,
    p_qte DECIMAL(10,2),
    p_prix DECIMAL(10,2),
    p_tva DECIMAL(5,2),
    p_total_ligne DECIMAL(10,2)
)
RETURNS JSON AS $$
DECLARE
    insert_query TEXT;
BEGIN
    -- Construire la requête d'insertion avec le format schéma.table
    insert_query := format('
        INSERT INTO %I.detail_bl (nfact, narticle, qte, prix, tva, total_ligne)
        VALUES ($1, $2, $3, $4, $5, $6)',
        p_tenant
    );
    
    -- Exécuter l'insertion
    EXECUTE insert_query 
    USING p_nfact, p_narticle, p_qte, p_prix, p_tva, p_total_ligne;
    
    RETURN json_build_object(
        'success', true,
        'message', 'BL detail inserted successfully'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error inserting BL detail: ' || SQLERRM
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;