-- ============================================
-- SYSTÈME COMPLET AUTONOME POUR MYSQL
-- ============================================
-- Ce script crée un système d'authentification
-- COMPLÈTEMENT INDÉPENDANT dans MySQL
-- ============================================

-- Créer une base centrale pour l'authentification (si elle n'existe pas)
CREATE DATABASE IF NOT EXISTS stock_management_auth;
USE stock_management_auth;

-- ==================== TABLE USERS ====================

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(191) UNIQUE NOT NULL, -- 191 pour utf8mb4 (767/4 = 191)
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'manager', 'user'
    business_units JSON, -- Array des BU auxquelles l'utilisateur a accès
    active BOOLEAN DEFAULT TRUE,
    last_login DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_active (active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE BUSINESS_UNITS ====================

CREATE TABLE IF NOT EXISTS business_units (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schema_name VARCHAR(100) UNIQUE NOT NULL, -- ex: bu01_2024, bu02_2024
    bu_code VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    nom_entreprise VARCHAR(191), -- 191 pour utf8mb4
    adresse TEXT,
    telephone VARCHAR(50),
    email VARCHAR(191), -- 191 pour utf8mb4
    active BOOLEAN DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_schema_name (schema_name),
    INDEX idx_active (active),
    INDEX idx_year (year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE USER_PERMISSIONS ====================

CREATE TABLE IF NOT EXISTS user_permissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    module VARCHAR(50) NOT NULL, -- 'articles', 'clients', 'suppliers', 'sales', 'purchases', 'stock', 'reports', 'settings'
    can_read BOOLEAN DEFAULT TRUE,
    can_create BOOLEAN DEFAULT FALSE,
    can_update BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_module (user_id, module)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==================== TABLE SYSTEM_LOGS ====================

CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(100),
    level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'success'
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_level (level),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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
    DECLARE v_full_name VARCHAR(255);
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

-- ==================== DONNÉES INITIALES ====================

-- Créer un utilisateur admin par défaut (si n'existe pas déjà)
-- On utilise INSERT IGNORE pour éviter l'erreur de duplication
INSERT IGNORE INTO users (username, email, password_hash, full_name, role, business_units, active, created_at)
VALUES (
    'admin',
    'admin@example.com',
    SHA2('admin123', 256),
    'Administrateur Système',
    'admin',
    JSON_ARRAY('bu01_2024', 'bu02_2024'),
    TRUE,
    NOW()
);

-- Afficher le statut
SELECT IF(ROW_COUNT() > 0, 
    '✅ Utilisateur admin créé', 
    '⚠️  Utilisateur admin existe déjà'
) as admin_status;

-- Créer quelques Business Units par défaut (si n'existent pas déjà)
INSERT IGNORE INTO business_units (schema_name, bu_code, year, nom_entreprise, active) VALUES
('bu01_2024', 'BU01', 2024, 'ETS BENAMAR BOUZID MENOUAR', TRUE),
('bu02_2024', 'BU02', 2024, 'ETS BENAMAR BOUZID MENOUAR', TRUE),
('bu01_2025', 'BU01', 2025, 'ETS BENAMAR BOUZID MENOUAR', TRUE),
('bu02_2025', 'BU02', 2025, 'ETS BENAMAR BOUZID MENOUAR', TRUE);

-- ==================== MESSAGES DE CONFIRMATION ====================

SELECT '✅ Système MySQL autonome créé avec succès!' as message;
SELECT '🔐 Fonction authenticate_user() avec hash SHA-256 activée' as info;
SELECT '👤 Utilisateur admin créé: admin / admin123' as credentials;
SELECT '📊 4 Business Units créées' as business_units;
SELECT '---' as sep1;
SELECT '📝 PROCÉDURES DISPONIBLES:' as title;
SELECT '  - create_user(username, email, password, full_name, role, business_units_json)' as proc1;
SELECT '  - update_user(user_id, username, email, password, full_name, role, business_units_json, active)' as proc2;
SELECT '  - delete_user(user_id)' as proc3;
SELECT '---' as sep2;
SELECT '🧪 TEST:' as test_title;
SELECT '  SELECT authenticate_user(''admin'', ''admin123'');' as test_command;
