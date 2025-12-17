-- =====================================================
-- SYSTÈME D'AUTHENTIFICATION COMPLET
-- =====================================================

-- ==================== TABLE USERS ====================

-- Table pour stocker les utilisateurs
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

-- ==================== TABLE PERMISSIONS ====================

-- Table pour les permissions détaillées par module
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

-- ==================== TABLE SESSIONS ====================

-- Table pour gérer les sessions actives
CREATE TABLE IF NOT EXISTS public.user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour les sessions
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.user_sessions(expires_at);

-- ==================== TABLE LOGS ====================

-- Table pour les logs d'activité
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

-- Index pour les logs
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON public.system_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_level ON public.system_logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON public.system_logs(created_at);

-- ==================== FONCTIONS D'AUTHENTIFICATION ====================

-- Fonction pour authentifier un utilisateur (accepte email OU username)
CREATE OR REPLACE FUNCTION authenticate_user(
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
BEGIN
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
    
    -- Vérifier le mot de passe (pour l'instant comparaison simple, à remplacer par bcrypt)
    IF v_user.password_hash != p_password THEN
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

-- Fonction pour créer une session
CREATE OR REPLACE FUNCTION create_session(
    p_user_id INTEGER,
    p_token VARCHAR,
    p_ip_address VARCHAR DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_expires_in_hours INTEGER DEFAULT 24
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session_id INTEGER;
    v_expires_at TIMESTAMP;
BEGIN
    v_expires_at := CURRENT_TIMESTAMP + (p_expires_in_hours || ' hours')::INTERVAL;
    
    -- Créer la session
    INSERT INTO public.user_sessions (user_id, token, ip_address, user_agent, expires_at)
    VALUES (p_user_id, p_token, p_ip_address, p_user_agent, v_expires_at)
    RETURNING id INTO v_session_id;
    
    RETURN json_build_object(
        'success', true,
        'session_id', v_session_id,
        'expires_at', v_expires_at
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la création de la session: ' || SQLERRM
        );
END;
$$;

-- Fonction pour valider une session
CREATE OR REPLACE FUNCTION validate_session(p_token VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_session RECORD;
    v_user RECORD;
    v_result JSON;
BEGIN
    -- Récupérer la session
    SELECT s.*, u.username, u.email, u.full_name, u.role, u.business_units, u.active
    INTO v_session
    FROM public.user_sessions s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.token = p_token AND s.expires_at > CURRENT_TIMESTAMP AND u.active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Session invalide ou expirée'
        );
    END IF;
    
    -- Retourner les informations de l'utilisateur
    v_result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_session.user_id,
            'username', v_session.username,
            'email', v_session.email,
            'full_name', v_session.full_name,
            'role', v_session.role,
            'business_units', v_session.business_units
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la validation de la session: ' || SQLERRM
        );
END;
$$;

-- Fonction pour déconnecter (supprimer la session)
CREATE OR REPLACE FUNCTION logout_user(p_token VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id INTEGER;
    v_username VARCHAR;
BEGIN
    -- Récupérer les infos avant de supprimer
    SELECT s.user_id, u.username
    INTO v_user_id, v_username
    FROM public.user_sessions s
    JOIN public.users u ON s.user_id = u.id
    WHERE s.token = p_token;
    
    IF FOUND THEN
        -- Logger la déconnexion
        INSERT INTO public.system_logs (user_id, username, level, action, details)
        VALUES (v_user_id, v_username, 'info', 'LOGOUT', 'Déconnexion');
        
        -- Supprimer la session
        DELETE FROM public.user_sessions WHERE token = p_token;
    END IF;
    
    RETURN json_build_object('success', true);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la déconnexion: ' || SQLERRM
        );
END;
$$;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.user_sessions 
    WHERE expires_at < CURRENT_TIMESTAMP;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- ==================== FONCTIONS DE PERMISSIONS ====================

-- Fonction pour vérifier les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION check_user_permission(
    p_user_id INTEGER,
    p_module VARCHAR,
    p_action VARCHAR -- 'read', 'create', 'update', 'delete'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_role VARCHAR;
    v_has_permission BOOLEAN := false;
BEGIN
    -- Récupérer le rôle de l'utilisateur
    SELECT role INTO v_user_role FROM public.users WHERE id = p_user_id;
    
    -- Les admins ont tous les droits
    IF v_user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- Vérifier les permissions spécifiques
    CASE p_action
        WHEN 'read' THEN
            SELECT can_read INTO v_has_permission
            FROM public.user_permissions
            WHERE user_id = p_user_id AND module = p_module;
        WHEN 'create' THEN
            SELECT can_create INTO v_has_permission
            FROM public.user_permissions
            WHERE user_id = p_user_id AND module = p_module;
        WHEN 'update' THEN
            SELECT can_update INTO v_has_permission
            FROM public.user_permissions
            WHERE user_id = p_user_id AND module = p_module;
        WHEN 'delete' THEN
            SELECT can_delete INTO v_has_permission
            FROM public.user_permissions
            WHERE user_id = p_user_id AND module = p_module;
    END CASE;
    
    RETURN COALESCE(v_has_permission, false);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN false;
END;
$$;

-- Fonction pour définir les permissions par défaut selon le rôle
CREATE OR REPLACE FUNCTION set_default_permissions(p_user_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_role VARCHAR;
    v_modules VARCHAR[] := ARRAY['articles', 'clients', 'suppliers', 'sales', 'purchases', 'stock', 'reports', 'settings'];
    v_module VARCHAR;
BEGIN
    -- Récupérer le rôle
    SELECT role INTO v_role FROM public.users WHERE id = p_user_id;
    
    -- Supprimer les permissions existantes
    DELETE FROM public.user_permissions WHERE user_id = p_user_id;
    
    -- Définir les permissions selon le rôle
    FOREACH v_module IN ARRAY v_modules
    LOOP
        IF v_role = 'admin' THEN
            -- Admin : tous les droits
            INSERT INTO public.user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
            VALUES (p_user_id, v_module, true, true, true, true);
        ELSIF v_role = 'manager' THEN
            -- Manager : tous les droits sauf suppression sur certains modules
            INSERT INTO public.user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
            VALUES (p_user_id, v_module, true, true, true, v_module NOT IN ('settings'));
        ELSE
            -- User : lecture seule + création/modification limitée
            INSERT INTO public.user_permissions (user_id, module, can_read, can_create, can_update, can_delete)
            VALUES (p_user_id, v_module, true, v_module IN ('sales', 'purchases'), v_module IN ('sales', 'purchases'), false);
        END IF;
    END LOOP;
END;
$$;

-- ==================== FONCTIONS DE LOGS ====================

-- Fonction pour récupérer les logs
CREATE OR REPLACE FUNCTION get_system_logs(
    p_limit INTEGER DEFAULT 100,
    p_level VARCHAR DEFAULT NULL,
    p_user_id INTEGER DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'id', id,
            'timestamp', created_at,
            'level', level,
            'user', username,
            'action', action,
            'details', details,
            'ip_address', ip_address
        ) ORDER BY created_at DESC
    )
    INTO v_result
    FROM public.system_logs
    WHERE (p_level IS NULL OR level = p_level)
      AND (p_user_id IS NULL OR user_id = p_user_id)
    LIMIT p_limit;
    
    RETURN COALESCE(v_result, '[]'::json);
END;
$$;

-- Fonction pour logger une action
CREATE OR REPLACE FUNCTION log_action(
    p_user_id INTEGER,
    p_username VARCHAR,
    p_level VARCHAR,
    p_action VARCHAR,
    p_details TEXT DEFAULT NULL,
    p_ip_address VARCHAR DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.system_logs (user_id, username, level, action, details, ip_address)
    VALUES (p_user_id, p_username, p_level, p_action, p_details, p_ip_address);
END;
$$;

-- ==================== DONNÉES INITIALES ====================

-- Créer un utilisateur admin par défaut
INSERT INTO public.users (username, email, password_hash, full_name, role, business_units)
VALUES ('admin', 'admin@example.com', 'admin123', 'Administrateur Système', 'admin', ARRAY['2025_bu01', '2024_bu01', '2025_bu02'])
ON CONFLICT (username) DO NOTHING;

-- Créer un utilisateur manager de test
INSERT INTO public.users (username, email, password_hash, full_name, role, business_units)
VALUES ('manager', 'manager@example.com', 'manager123', 'Manager Test', 'manager', ARRAY['2025_bu01'])
ON CONFLICT (username) DO NOTHING;

-- Créer un utilisateur normal de test
INSERT INTO public.users (username, email, password_hash, full_name, role, business_units)
VALUES ('user', 'user@example.com', 'user123', 'Utilisateur Test', 'user', ARRAY['2025_bu01'])
ON CONFLICT (username) DO NOTHING;

-- Définir les permissions par défaut pour tous les utilisateurs
DO $$
DECLARE
    v_user RECORD;
BEGIN
    FOR v_user IN SELECT id FROM public.users
    LOOP
        PERFORM set_default_permissions(v_user.id);
    END LOOP;
END $$;

-- ==================== PERMISSIONS ====================

GRANT EXECUTE ON FUNCTION authenticate_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_session TO anon, authenticated;
GRANT EXECUTE ON FUNCTION logout_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_user_permission TO anon, authenticated;
GRANT EXECUTE ON FUNCTION set_default_permissions TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_system_logs TO anon, authenticated;
GRANT EXECUTE ON FUNCTION log_action TO anon, authenticated;

-- ==================== COMMENTAIRES ====================

COMMENT ON TABLE public.users IS 'Table des utilisateurs du système';
COMMENT ON TABLE public.user_permissions IS 'Permissions détaillées par module pour chaque utilisateur';
COMMENT ON TABLE public.user_sessions IS 'Sessions actives des utilisateurs';
COMMENT ON TABLE public.system_logs IS 'Logs d''activité du système';

COMMENT ON FUNCTION authenticate_user IS 'Authentifie un utilisateur avec username/password';
COMMENT ON FUNCTION create_session IS 'Crée une nouvelle session pour un utilisateur';
COMMENT ON FUNCTION validate_session IS 'Valide un token de session';
COMMENT ON FUNCTION logout_user IS 'Déconnecte un utilisateur (supprime sa session)';
COMMENT ON FUNCTION check_user_permission IS 'Vérifie si un utilisateur a une permission spécifique';
COMMENT ON FUNCTION get_system_logs IS 'Récupère les logs système avec filtres';
