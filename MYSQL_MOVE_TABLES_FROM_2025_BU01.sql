-- ============================================
-- DÉPLACER LES TABLES DE 2025_bu01 vers stock_management_auth
-- ============================================

-- S'assurer que la base de destination existe
CREATE DATABASE IF NOT EXISTS stock_management_auth;

-- Afficher les tables à déplacer
SELECT 'Tables trouvées dans 2025_bu01:' as info;
SELECT TABLE_NAME 
FROM information_schema.TABLES 
WHERE TABLE_SCHEMA = '2025_bu01' 
AND TABLE_NAME IN ('users', 'business_units', 'user_permissions', 'system_logs');

-- Déplacer les tables
RENAME TABLE `2025_bu01`.users TO stock_management_auth.users;
RENAME TABLE `2025_bu01`.business_units TO stock_management_auth.business_units;
RENAME TABLE `2025_bu01`.user_permissions TO stock_management_auth.user_permissions;
RENAME TABLE `2025_bu01`.system_logs TO stock_management_auth.system_logs;

SELECT '✅ Tables déplacées vers stock_management_auth' as status;

-- Vérifier le déplacement
SELECT 'Tables maintenant dans stock_management_auth:' as info;
SHOW TABLES FROM stock_management_auth;

-- Maintenant il faut recréer les fonctions et procédures dans la bonne base
USE stock_management_auth;

-- ==================== FONCTION AUTHENTICATE_USER ====================

DELIMITER $$

DROP FUNCTION IF EXISTS authenticate_user$$

CREATE FUNCTION authenticate_user(
    p_username VARCHAR(191),
    p_password VARCHAR(255)
)
RETURNS JSON
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_user_id INT;
    DECLARE v_username VARCHAR(191);
    DECLARE v_email VARCHAR(191);
    DECLARE v_password_hash VARCHAR(255);
    DECLARE v_full_name VARCHAR(191);
    DECLARE v_role VARCHAR(50);
    DECLARE v_business_units JSON;
    DECLARE v_active BOOLEAN;
    DECLARE v_password_hash_input VARCHAR(255);
    DECLARE v_result JSON;
    
    -- Hasher le mot de passe fourni avec SHA-256
    SET v_password_hash_input = SHA2(p_password, 256);
    
    -- Récupérer l'utilisateur par username OU email
    SELECT 
        id, username, email, password_hash, full_name, role, 
        business_units, active
    INTO 
        v_user_id, v_username, v_email, v_password_hash, v_full_name, 
        v_role, v_business_units, v_active
    FROM users
    WHERE (username = p_username OR email = p_username) AND active = 1
    LIMIT 1;
    
    -- Vérifier si l'utilisateur existe
    IF v_user_id IS NULL THEN
        SET v_result = JSON_OBJECT(
            'success', FALSE,
            'error', 'Utilisateur non trouvé ou inactif'
        );
        RETURN v_result;
    END IF;
    
    -- Vérifier le mot de passe hashé
    IF v_password_hash != v_password_hash_input THEN
        -- Logger la tentative échouée
        INSERT INTO system_logs (user_id, username, level, action, details, created_at)
        VALUES (v_user_id, v_username, 'warning', 'FAILED_LOGIN', 'Mot de passe incorrect', NOW());
        
        SET v_result = JSON_OBJECT(
            'success', FALSE,
            'error', 'Mot de passe incorrect'
        );
        RETURN v_result;
    END IF;
    
    -- Mettre à jour la date de dernière connexion
    UPDATE users 
    SET last_login = NOW() 
    WHERE id = v_user_id;
    
    -- Logger la connexion réussie
    INSERT INTO system_logs (user_id, username, level, action, details, created_at)
    VALUES (v_user_id, v_username, 'success', 'LOGIN', 'Connexion réussie', NOW());
    
    -- Retourner les informations de l'utilisateur
    SET v_result = JSON_OBJECT(
        'success', TRUE,
        'user', JSON_OBJECT(
            'id', v_user_id,
            'username', v_username,
            'email', v_email,
            'full_name', v_full_name,
            'role', v_role,
            'business_units', v_business_units
        )
    );
    
    RETURN v_result;
END$$

DELIMITER ;

-- ==================== PROCÉDURE CREATE_USER ====================

DELIMITER $$

DROP PROCEDURE IF EXISTS create_user$$

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
END$$

DELIMITER ;

-- ==================== PROCÉDURE UPDATE_USER ====================

DELIMITER $$

DROP PROCEDURE IF EXISTS update_user$$

CREATE PROCEDURE update_user(
    IN p_user_id INT,
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(191),
    IN p_password VARCHAR(255), -- NULL si pas de changement
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
END$$

DELIMITER ;

-- ==================== PROCÉDURE DELETE_USER ====================

DELIMITER $$

DROP PROCEDURE IF EXISTS delete_user$$

CREATE PROCEDURE delete_user(
    IN p_user_id INT
)
BEGIN
    DELETE FROM users WHERE id = p_user_id;
    SELECT 'Utilisateur supprimé avec succès' as message;
END$$

DELIMITER ;

-- ==================== VÉRIFICATION FINALE ====================

SELECT '✅ Fonctions et procédures recréées dans stock_management_auth' as status;

-- Tester la fonction
SELECT 'Test de authenticate_user:' as test;
SELECT authenticate_user('admin', 'admin123') as result;

-- Afficher les utilisateurs
SELECT 'Utilisateurs dans stock_management_auth:' as info;
SELECT id, username, email, role, active FROM users;

SELECT '🎉 Migration terminée avec succès!' as final_status;
