-- ==================== PROCÉDURES ====================

USE stock_management_auth;

-- ==================== PROCÉDURE CREATE_USER ====================

DROP PROCEDURE IF EXISTS create_user;

CREATE PROCEDURE create_user(
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(191),
    IN p_password VARCHAR(255),
    IN p_full_name VARCHAR(191),
    IN p_role VARCHAR(50),
    IN p_business_units JSON
)
BEGIN
    DECLARE v_password_hash VARCHAR(255);
    
    -- Hasher le mot de passe
    SET v_password_hash = SHA2(p_password, 256);
    
    -- Insérer l'utilisateur
    INSERT INTO users (
        username, email, password_hash, full_name, role, business_units, active
    ) VALUES (
        p_username, p_email, v_password_hash, p_full_name, 
        COALESCE(p_role, 'user'), p_business_units, TRUE
    );
    
    -- Retourner l'ID du nouvel utilisateur
    SELECT LAST_INSERT_ID() as user_id, 'Utilisateur créé avec succès' as message;
END;

-- ==================== PROCÉDURE UPDATE_USER ====================

DROP PROCEDURE IF EXISTS update_user;

CREATE PROCEDURE update_user(
    IN p_user_id INT,
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(191),
    IN p_password VARCHAR(255),
    IN p_full_name VARCHAR(191),
    IN p_role VARCHAR(50),
    IN p_business_units JSON,
    IN p_active BOOLEAN
)
BEGIN
    DECLARE v_password_hash VARCHAR(255);
    
    -- Si un nouveau mot de passe est fourni, le hasher
    IF p_password IS NOT NULL AND p_password != '' THEN
        SET v_password_hash = SHA2(p_password, 256);
        
        UPDATE users 
        SET 
            username = p_username,
            email = p_email,
            password_hash = v_password_hash,
            full_name = p_full_name,
            role = p_role,
            business_units = p_business_units,
            active = p_active,
            updated_at = NOW()
        WHERE id = p_user_id;
    ELSE
        -- Pas de changement de mot de passe
        UPDATE users 
        SET 
            username = p_username,
            email = p_email,
            full_name = p_full_name,
            role = p_role,
            business_units = p_business_units,
            active = p_active,
            updated_at = NOW()
        WHERE id = p_user_id;
    END IF;
    
    SELECT 'Utilisateur mis à jour avec succès' as message;
END;

-- ==================== PROCÉDURE DELETE_USER ====================

DROP PROCEDURE IF EXISTS delete_user;

CREATE PROCEDURE delete_user(
    IN p_user_id INT
)
BEGIN
    DELETE FROM users WHERE id = p_user_id;
    SELECT 'Utilisateur supprimé avec succès' as message;
END;
