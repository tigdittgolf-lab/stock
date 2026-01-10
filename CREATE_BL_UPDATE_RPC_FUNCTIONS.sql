-- =====================================================
-- FONCTIONS RPC POUR LA MODIFICATION DES BL
-- =====================================================

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
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schema_name TEXT;
    v_sql TEXT;
    v_result JSON;
BEGIN
    -- Construire le nom du schéma
    v_schema_name := p_tenant;
    
    -- Vérifier que le schéma existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = v_schema_name
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Schema ' || v_schema_name || ' does not exist'
        );
    END IF;
    
    -- Construire et exécuter la requête de mise à jour
    v_sql := format('
        UPDATE %I.fact 
        SET 
            nclient = %L,
            date_fact = %L,
            montant_ht = %s,
            tva = %s,
            montant_ttc = %s,
            updated_at = CURRENT_TIMESTAMP
        WHERE nfact = %s
        RETURNING nfact',
        v_schema_name,
        p_nclient,
        p_date_fact,
        p_montant_ht,
        p_tva,
        p_montant_ttc,
        p_nfact
    );
    
    EXECUTE v_sql;
    
    -- Vérifier si la mise à jour a réussi
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'BL ' || p_nfact || ' not found in schema ' || v_schema_name
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'BL updated successfully',
        'nfact', p_nfact
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error updating BL: ' || SQLERRM
        );
END;
$$;

-- 2. Fonction pour supprimer les détails d'un BL
CREATE OR REPLACE FUNCTION delete_bl_details(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schema_name TEXT;
    v_sql TEXT;
    v_deleted_count INTEGER;
BEGIN
    -- Construire le nom du schéma
    v_schema_name := p_tenant;
    
    -- Vérifier que le schéma existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = v_schema_name
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Schema ' || v_schema_name || ' does not exist'
        );
    END IF;
    
    -- Construire et exécuter la requête de suppression
    v_sql := format('
        DELETE FROM %I.detail_fact 
        WHERE nfact = %s',
        v_schema_name,
        p_nfact
    );
    
    EXECUTE v_sql;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN json_build_object(
        'success', true,
        'message', 'BL details deleted successfully',
        'deleted_count', v_deleted_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Error deleting BL details: ' || SQLERRM
        );
END;
$$;

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
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schema_name TEXT;
    v_sql TEXT;
BEGIN
    -- Construire le nom du schéma
    v_schema_name := p_tenant;
    
    -- Vérifier que le schéma existe
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.schemata 
        WHERE schema_name = v_schema_name
    ) THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Schema ' || v_schema_name || ' does not exist'
        );
    END IF;
    
    -- Construire et exécuter la requête d'insertion
    v_sql := format('
        INSERT INTO %I.detail_fact (
            nfact, narticle, qte, prix, tva, total_ligne
        ) VALUES (
            %s, %L, %s, %s, %s, %s
        )',
        v_schema_name,
        p_nfact,
        p_narticle,
        p_qte,
        p_prix,
        p_tva,
        p_total_ligne
    );
    
    EXECUTE v_sql;
    
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
$$;

-- =====================================================
-- COMMENTAIRES D'UTILISATION
-- =====================================================

/*
UTILISATION:

1. Mettre à jour un BL:
SELECT update_bl(
    '2025_bu01',  -- tenant
    1,            -- nfact
    'CL01',       -- nclient
    '2025-01-10', -- date_fact
    1000.00,      -- montant_ht
    190.00,       -- tva
    1190.00       -- montant_ttc
);

2. Supprimer les détails d'un BL:
SELECT delete_bl_details('2025_bu01', 1);

3. Insérer un détail de BL:
SELECT insert_bl_detail(
    '2025_bu01',  -- tenant
    1,            -- nfact
    'ART001',     -- narticle
    2.00,         -- qte
    500.00,       -- prix
    19.00,        -- tva
    1190.00       -- total_ligne
);
*/