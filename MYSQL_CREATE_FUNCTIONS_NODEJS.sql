-- ==================== FONCTION AUTHENTICATE_USER ====================

USE stock_management_auth;

DROP FUNCTION IF EXISTS authenticate_user;

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
END;
