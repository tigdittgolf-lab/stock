-- ============================================
-- SYSTÈME COMPLET AUTONOME POUR POSTGRESQL
-- ============================================
-- Ce script crée un système d'authentification
-- COMPLÈTEMENT INDÉPENDANT dans PostgreSQL
-- ============================================

-- Créer la base de données si elle n'existe pas
-- (À exécuter en tant que superuser)
-- CREATE DATABASE stock_management;
-- \c stock_management

-- ==================== TABLE USERS ====================

CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'manager', 'user'
    business_units TEXT[], -- Array des BU auxquelles l'utilisateur a accès
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(active);

-- ==================== TABLE BUSINESS_UNITS ====================

CREATE TABLE IF NOT EXISTS public.business_units (
    id SERIAL PRIMARY KEY,
    schema_name VARCHAR(100) UNIQUE NOT NULL, -- ex: bu01_2024, bu02_2024
    bu_code VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    nom_entreprise VARCHAR(255),
    adresse TEXT,
    telephone VARCHAR(50),
    email VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bu_schema_name ON public.business_units(schema_name);
CREATE INDEX IF NOT EXISTS idx_bu_active ON public.business_units(active);
CREATE INDEX IF NOT EXISTS idx_bu_year ON public.business_units(year);

-- ==================== TABLE USER_PERMISSIONS ====================

CREATE TABLE IF NOT EXISTS public.user_permissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL, -- 'articles', 'clients', 'suppliers', 'sales', 'purchases', 'stock', 'reports', 'settings'
    can_read BOOLEAN DEFAULT true,
    can_create BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, module)
);

-- ==================== TABLE SYSTEM_LOGS ====================

CREATE TABLE IF NOT EXISTS public.system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    level VARCHAR(20) NOT NULL, -- 'info', 'warning', 'error', 'success'
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.system_logs(created_at);

-- ==================== FONCTION AUTHENTICATE_USER ====================

CREATE OR REPLACE FUNCTION public.authenticate_user(
    p_username VARCHAR,
    p_password VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_result JSON;
    v_password_hash TEXT;
BEGIN
    -- Hasher le mot de passe fourni avec SHA-256
    v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
    
    -- Récupérer l'utilisateur par username OU email
    SELECT 
        id, username, email, password_hash, full_name, role, 
        business_units, active
    INTO v_user
    FROM public.users
    WHERE (username = p_username OR email = p_username) AND active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Utilisateur non trouvé ou inactif'
        );
    END IF;
    
    -- Vérifier le mot de passe hashé
    IF v_user.password_hash != v_password_hash THEN
        -- Logger la tentative échouée
        INSERT INTO public.system_logs (user_id, username, level, action, details)
        VALUES (v_user.id, v_user.username, 'warning', 'FAILED_LOGIN', 'Mot de passe incorrect');
        
        RETURN json_build_object(
            'success', false,
            'error', 'Mot de passe incorrect'
        );
    END IF;
    
    -- Mettre à jour la date de dernière connexion
    UPDATE public.users 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE id = v_user.id;
    
    -- Logger la connexion réussie
    INSERT INTO public.system_logs (user_id, username, level, action, details)
    VALUES (v_user.id, v_user.username, 'success', 'LOGIN', 'Connexion réussie');
    
    -- Retourner les informations de l'utilisateur
    v_result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_user.id,
            'username', v_user.username,
            'email', v_user.email,
            'full_name', v_user.full_name,
            'role', v_user.role,
            'business_units', v_user.business_units
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de l''authentification: ' || SQLERRM
        );
END;
$$;

-- ==================== FONCTION CREATE_USER ====================

CREATE OR REPLACE FUNCTION public.create_user(
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_full_name VARCHAR DEFAULT NULL,
    p_role VARCHAR DEFAULT 'user',
    p_business_units TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_password_hash TEXT;
    v_new_user RECORD;
BEGIN
    -- Hasher le mot de passe
    v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
    
    -- Insérer l'utilisateur
    INSERT INTO public.users (
        username, email, password_hash, full_name, role, business_units, active
    ) VALUES (
        p_username, p_email, v_password_hash, p_full_name, 
        COALESCE(p_role, 'user'), p_business_units, true
    )
    RETURNING * INTO v_new_user;
    
    -- Retourner les informations du nouvel utilisateur
    RETURN json_build_object(
        'success', true,
        'message', 'Utilisateur créé avec succès',
        'user', json_build_object(
            'id', v_new_user.id,
            'username', v_new_user.username,
            'email', v_new_user.email,
            'role', v_new_user.role
        )
    );
    
EXCEPTION
    WHEN unique_violation THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Username ou email déjà utilisé'
        );
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la création: ' || SQLERRM
        );
END;
$$;

-- ==================== FONCTION UPDATE_USER ====================

CREATE OR REPLACE FUNCTION public.update_user(
    p_user_id INTEGER,
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR DEFAULT NULL, -- NULL si pas de changement
    p_full_name VARCHAR DEFAULT NULL,
    p_role VARCHAR DEFAULT NULL,
    p_business_units TEXT[] DEFAULT NULL,
    p_active BOOLEAN DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_password_hash TEXT;
    v_updated_user RECORD;
BEGIN
    -- Si un nouveau mot de passe est fourni, le hasher
    IF p_password IS NOT NULL AND p_password != '' THEN
        v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
        
        UPDATE public.users 
        SET 
            username = COALESCE(p_username, username),
            email = COALESCE(p_email, email),
            password_hash = v_password_hash,
            full_name = COALESCE(p_full_name, full_name),
            role = COALESCE(p_role, role),
            business_units = COALESCE(p_business_units, business_units),
            active = COALESCE(p_active, active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id
        RETURNING * INTO v_updated_user;
    ELSE
        -- Pas de changement de mot de passe
        UPDATE public.users 
        SET 
            username = COALESCE(p_username, username),
            email = COALESCE(p_email, email),
            full_name = COALESCE(p_full_name, full_name),
            role = COALESCE(p_role, role),
            business_units = COALESCE(p_business_units, business_units),
            active = COALESCE(p_active, active),
            updated_at = CURRENT_TIMESTAMP
        WHERE id = p_user_id
        RETURNING * INTO v_updated_user;
    END IF;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Utilisateur non trouvé'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Utilisateur mis à jour avec succès',
        'user', json_build_object(
            'id', v_updated_user.id,
            'username', v_updated_user.username,
            'email', v_updated_user.email,
            'role', v_updated_user.role
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la mise à jour: ' || SQLERRM
        );
END;
$$;

-- ==================== FONCTION DELETE_USER ====================

CREATE OR REPLACE FUNCTION public.delete_user(
    p_user_id INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Utilisateur non trouvé'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Utilisateur supprimé avec succès'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la suppression: ' || SQLERRM
        );
END;
$$;

-- ==================== PERMISSIONS ====================

GRANT EXECUTE ON FUNCTION public.authenticate_user TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_user TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.update_user TO PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user TO PUBLIC;

-- ==================== DONNÉES INITIALES ====================

-- Créer un utilisateur admin par défaut
SELECT public.create_user(
    'admin',
    'admin@example.com',
    'admin123',
    'Administrateur Système',
    'admin',
    ARRAY['bu01_2024', 'bu02_2024']
);

-- Créer quelques Business Units par défaut
INSERT INTO public.business_units (schema_name, bu_code, year, nom_entreprise, active) VALUES
('bu01_2024', 'BU01', 2024, 'ETS BENAMAR BOUZID MENOUAR', true),
('bu02_2024', 'BU02', 2024, 'ETS BENAMAR BOUZID MENOUAR', true),
('bu01_2025', 'BU01', 2025, 'ETS BENAMAR BOUZID MENOUAR', true),
('bu02_2025', 'BU02', 2025, 'ETS BENAMAR BOUZID MENOUAR', true);

-- ==================== MESSAGES DE CONFIRMATION ====================

DO $$
BEGIN
    RAISE NOTICE '✅ Système PostgreSQL autonome créé avec succès!';
    RAISE NOTICE '🔐 Fonction authenticate_user() avec hash SHA-256 activée';
    RAISE NOTICE '👤 Utilisateur admin créé: admin / admin123';
    RAISE NOTICE '📊 4 Business Units créées';
    RAISE NOTICE '';
    RAISE NOTICE '📝 FONCTIONS DISPONIBLES:';
    RAISE NOTICE '  - create_user(username, email, password, full_name, role, business_units_array)';
    RAISE NOTICE '  - update_user(user_id, username, email, password, full_name, role, business_units_array, active)';
    RAISE NOTICE '  - delete_user(user_id)';
    RAISE NOTICE '';
    RAISE NOTICE '🧪 TEST:';
    RAISE NOTICE '  SELECT authenticate_user(''admin'', ''admin123'');';
END $$;
