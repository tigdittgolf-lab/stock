-- =====================================================
-- FONCTIONS RPC POUR LA MODIFICATION DES BL - VERSION MYSQL
-- =====================================================

DELIMITER $$

-- 1. Fonction pour mettre à jour un BL
DROP FUNCTION IF EXISTS update_bl$$

CREATE FUNCTION update_bl(
    p_tenant VARCHAR(255),
    p_nfact INT,
    p_nclient VARCHAR(255),
    p_date_fact DATE,
    p_montant_ht DECIMAL(10,2),
    p_tva DECIMAL(10,2),
    p_montant_ttc DECIMAL(10,2)
)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_schema_name VARCHAR(255);
    DECLARE v_sql TEXT;
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_result JSON;
    
    -- Construire le nom du schéma
    SET v_schema_name = p_tenant;
    
    -- Vérifier que la base de données existe
    SELECT COUNT(*) INTO v_count
    FROM information_schema.SCHEMATA 
    WHERE SCHEMA_NAME = v_schema_name;
    
    IF v_count = 0 THEN
        SET v_result = JSON_OBJECT(
            'success', false,
            'error', CONCAT('Schema ', v_schema_name, ' does not exist')
        );
        RETURN v_result;
    END IF;
    
    -- Construire et exécuter la requête de mise à jour
    SET @sql = CONCAT('
        UPDATE `', v_schema_name, '`.`fact` 
        SET 
            nclient = ''', p_nclient, ''',
            date_fact = ''', p_date_fact, ''',
            montant_ht = ', p_montant_ht, ',
            tva = ', p_tva, ',
            montant_ttc = ', p_montant_ttc, ',
            updated_at = NOW()
        WHERE nfact = ', p_nfact
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Vérifier si la mise à jour a réussi
    IF ROW_COUNT() = 0 THEN
        SET v_result = JSON_OBJECT(
            'success', false,
            'error', CONCAT('BL ', p_nfact, ' not found in schema ', v_schema_name)
        );
        RETURN v_result;
    END IF;
    
    SET v_result = JSON_OBJECT(
        'success', true,
        'message', 'BL updated successfully',
        'nfact', p_nfact
    );
    
    RETURN v_result;
END$$

-- 2. Fonction pour supprimer les détails d'un BL
DROP FUNCTION IF EXISTS delete_bl_details$$

CREATE FUNCTION delete_bl_details(
    p_tenant VARCHAR(255),
    p_nfact INT
)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_schema_name VARCHAR(255);
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_deleted_count INT DEFAULT 0;
    DECLARE v_result JSON;
    
    -- Construire le nom du schéma
    SET v_schema_name = p_tenant;
    
    -- Vérifier que la base de données existe
    SELECT COUNT(*) INTO v_count
    FROM information_schema.SCHEMATA 
    WHERE SCHEMA_NAME = v_schema_name;
    
    IF v_count = 0 THEN
        SET v_result = JSON_OBJECT(
            'success', false,
            'error', CONCAT('Schema ', v_schema_name, ' does not exist')
        );
        RETURN v_result;
    END IF;
    
    -- Construire et exécuter la requête de suppression
    SET @sql = CONCAT('
        DELETE FROM `', v_schema_name, '`.`detail_fact` 
        WHERE nfact = ', p_nfact
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    SET v_deleted_count = ROW_COUNT();
    DEALLOCATE PREPARE stmt;
    
    SET v_result = JSON_OBJECT(
        'success', true,
        'message', 'BL details deleted successfully',
        'deleted_count', v_deleted_count
    );
    
    RETURN v_result;
END$$

-- 3. Fonction pour insérer un détail de BL
DROP FUNCTION IF EXISTS insert_bl_detail$$

CREATE FUNCTION insert_bl_detail(
    p_tenant VARCHAR(255),
    p_nfact INT,
    p_narticle VARCHAR(255),
    p_qte DECIMAL(10,2),
    p_prix DECIMAL(10,2),
    p_tva DECIMAL(5,2),
    p_total_ligne DECIMAL(10,2)
)
RETURNS JSON
READS SQL DATA
DETERMINISTIC
BEGIN
    DECLARE v_schema_name VARCHAR(255);
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_result JSON;
    
    -- Construire le nom du schéma
    SET v_schema_name = p_tenant;
    
    -- Vérifier que la base de données existe
    SELECT COUNT(*) INTO v_count
    FROM information_schema.SCHEMATA 
    WHERE SCHEMA_NAME = v_schema_name;
    
    IF v_count = 0 THEN
        SET v_result = JSON_OBJECT(
            'success', false,
            'error', CONCAT('Schema ', v_schema_name, ' does not exist')
        );
        RETURN v_result;
    END IF;
    
    -- Construire et exécuter la requête d'insertion
    SET @sql = CONCAT('
        INSERT INTO `', v_schema_name, '`.`detail_fact` (
            nfact, narticle, qte, prix, tva, total_ligne
        ) VALUES (
            ', p_nfact, ', ''', p_narticle, ''', ', p_qte, ', ', p_prix, ', ', p_tva, ', ', p_total_ligne, '
        )'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SET v_result = JSON_OBJECT(
        'success', true,
        'message', 'BL detail inserted successfully'
    );
    
    RETURN v_result;
END$$

DELIMITER ;

-- =====================================================
-- COMMENTAIRES D'UTILISATION MYSQL
-- =====================================================

/*
UTILISATION MYSQL:

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

NOTES MYSQL:
- Utilise DELIMITER $$ pour définir les fonctions
- JSON_OBJECT() au lieu de json_build_object()
- Prepared statements pour les requêtes dynamiques
- ROW_COUNT() pour vérifier les modifications
- Gestion d'erreurs avec IF/THEN/ELSE
*/