-- =====================================================
-- PROCÉDURES STOCKÉES POUR LA MODIFICATION DES BL - VERSION MYSQL
-- =====================================================

DELIMITER $$

-- 1. Procédure pour mettre à jour un BL
DROP PROCEDURE IF EXISTS update_bl$$

CREATE PROCEDURE update_bl(
    IN p_tenant VARCHAR(255),
    IN p_nfact INT,
    IN p_nclient VARCHAR(255),
    IN p_date_fact DATE,
    IN p_montant_ht DECIMAL(10,2),
    IN p_tva DECIMAL(10,2),
    IN p_montant_ttc DECIMAL(10,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_error TEXT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE v_affected_rows INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('Error updating BL: ', p_error);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Vérifier que la base de données existe
    SELECT COUNT(*) INTO v_count
    FROM information_schema.SCHEMATA 
    WHERE SCHEMA_NAME = p_tenant;
    
    IF v_count = 0 THEN
        SET p_success = FALSE;
        SET p_error = CONCAT('Schema ', p_tenant, ' does not exist');
        SET p_message = p_error;
        ROLLBACK;
    ELSE
        -- Construire et exécuter la requête de mise à jour
        SET @sql = CONCAT('
            UPDATE `', p_tenant, '`.`fact` 
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
        SET v_affected_rows = ROW_COUNT();
        DEALLOCATE PREPARE stmt;
        
        IF v_affected_rows = 0 THEN
            SET p_success = FALSE;
            SET p_error = CONCAT('BL ', p_nfact, ' not found in schema ', p_tenant);
            SET p_message = p_error;
            ROLLBACK;
        ELSE
            SET p_success = TRUE;
            SET p_message = 'BL updated successfully';
            SET p_error = NULL;
            COMMIT;
        END IF;
    END IF;
END$$

-- 2. Procédure pour supprimer les détails d'un BL
DROP PROCEDURE IF EXISTS delete_bl_details$$

CREATE PROCEDURE delete_bl_details(
    IN p_tenant VARCHAR(255),
    IN p_nfact INT,
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_error TEXT,
    OUT p_deleted_count INT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('Error deleting BL details: ', p_error);
        SET p_deleted_count = 0;
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Vérifier que la base de données existe
    SELECT COUNT(*) INTO v_count
    FROM information_schema.SCHEMATA 
    WHERE SCHEMA_NAME = p_tenant;
    
    IF v_count = 0 THEN
        SET p_success = FALSE;
        SET p_error = CONCAT('Schema ', p_tenant, ' does not exist');
        SET p_message = p_error;
        SET p_deleted_count = 0;
        ROLLBACK;
    ELSE
        -- Construire et exécuter la requête de suppression
        SET @sql = CONCAT('
            DELETE FROM `', p_tenant, '`.`detail_fact` 
            WHERE nfact = ', p_nfact
        );
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        SET p_deleted_count = ROW_COUNT();
        DEALLOCATE PREPARE stmt;
        
        SET p_success = TRUE;
        SET p_message = 'BL details deleted successfully';
        SET p_error = NULL;
        COMMIT;
    END IF;
END$$

-- 3. Procédure pour insérer un détail de BL
DROP PROCEDURE IF EXISTS insert_bl_detail$$

CREATE PROCEDURE insert_bl_detail(
    IN p_tenant VARCHAR(255),
    IN p_nfact INT,
    IN p_narticle VARCHAR(255),
    IN p_qte DECIMAL(10,2),
    IN p_prix DECIMAL(10,2),
    IN p_tva DECIMAL(5,2),
    IN p_total_ligne DECIMAL(10,2),
    OUT p_success BOOLEAN,
    OUT p_message TEXT,
    OUT p_error TEXT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            p_error = MESSAGE_TEXT;
        SET p_success = FALSE;
        SET p_message = CONCAT('Error inserting BL detail: ', p_error);
        ROLLBACK;
    END;
    
    START TRANSACTION;
    
    -- Vérifier que la base de données existe
    SELECT COUNT(*) INTO v_count
    FROM information_schema.SCHEMATA 
    WHERE SCHEMA_NAME = p_tenant;
    
    IF v_count = 0 THEN
        SET p_success = FALSE;
        SET p_error = CONCAT('Schema ', p_tenant, ' does not exist');
        SET p_message = p_error;
        ROLLBACK;
    ELSE
        -- Construire et exécuter la requête d'insertion
        SET @sql = CONCAT('
            INSERT INTO `', p_tenant, '`.`detail_fact` (
                nfact, narticle, qte, prix, tva, total_ligne
            ) VALUES (
                ', p_nfact, ', ''', p_narticle, ''', ', p_qte, ', ', p_prix, ', ', p_tva, ', ', p_total_ligne, '
            )'
        );
        
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
        
        SET p_success = TRUE;
        SET p_message = 'BL detail inserted successfully';
        SET p_error = NULL;
        COMMIT;
    END IF;
END$$

-- 4. Procédure wrapper pour simuler une fonction JSON (optionnel)
DROP PROCEDURE IF EXISTS update_bl_json$$

CREATE PROCEDURE update_bl_json(
    IN p_tenant VARCHAR(255),
    IN p_nfact INT,
    IN p_nclient VARCHAR(255),
    IN p_date_fact DATE,
    IN p_montant_ht DECIMAL(10,2),
    IN p_tva DECIMAL(10,2),
    IN p_montant_ttc DECIMAL(10,2)
)
BEGIN
    DECLARE v_success BOOLEAN DEFAULT FALSE;
    DECLARE v_message TEXT DEFAULT '';
    DECLARE v_error TEXT DEFAULT '';
    
    CALL update_bl(p_tenant, p_nfact, p_nclient, p_date_fact, p_montant_ht, p_tva, p_montant_ttc, v_success, v_message, v_error);
    
    SELECT JSON_OBJECT(
        'success', v_success,
        'message', v_message,
        'error', v_error,
        'nfact', p_nfact
    ) AS result;
END$$

DELIMITER ;

-- =====================================================
-- COMMENTAIRES D'UTILISATION MYSQL PROCÉDURES
-- =====================================================

/*
UTILISATION MYSQL PROCÉDURES:

1. Mettre à jour un BL (avec variables de sortie):
CALL update_bl(
    '2025_bu01',  -- tenant
    1,            -- nfact
    'CL01',       -- nclient
    '2025-01-10', -- date_fact
    1000.00,      -- montant_ht
    190.00,       -- tva
    1190.00,      -- montant_ttc
    @success,     -- OUT success
    @message,     -- OUT message
    @error        -- OUT error
);
SELECT @success, @message, @error;

2. Mettre à jour un BL (avec retour JSON):
CALL update_bl_json('2025_bu01', 1, 'CL01', '2025-01-10', 1000.00, 190.00, 1190.00);

3. Supprimer les détails d'un BL:
CALL delete_bl_details('2025_bu01', 1, @success, @message, @error, @deleted_count);
SELECT @success, @message, @error, @deleted_count;

4. Insérer un détail de BL:
CALL insert_bl_detail(
    '2025_bu01',  -- tenant
    1,            -- nfact
    'ART001',     -- narticle
    2.00,         -- qte
    500.00,       -- prix
    19.00,        -- tva
    1190.00,      -- total_ligne
    @success,     -- OUT success
    @message,     -- OUT message
    @error        -- OUT error
);
SELECT @success, @message, @error;

NOTES MYSQL PROCÉDURES:
- Utilise des procédures stockées au lieu de fonctions
- Paramètres OUT pour retourner les résultats
- Gestion des transactions avec START TRANSACTION/COMMIT/ROLLBACK
- Gestion d'erreurs avec EXIT HANDLER
- Procédure wrapper pour retour JSON (optionnel)
*/