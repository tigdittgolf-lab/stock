-- ============================================
-- INITIALISER LES UTILISATEURS DANS SUPABASE
-- ============================================
-- Exécutez ce script dans l'éditeur SQL de Supabase
-- Dashboard → SQL Editor → New Query
-- ============================================

-- Créer la table users si elle n'existe pas
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user',
    business_units TEXT[],
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer les index
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON public.users(active);

-- Créer la table system_logs
CREATE TABLE IF NOT EXISTS public.system_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE SET NULL,
    username VARCHAR(100),
    level VARCHAR(20) NOT NULL,
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Créer la fonction authenticate_user
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
    
    -- Récupérer l'utilisateur
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

-- Supprimer les utilisateurs existants (optionnel)
-- DELETE FROM public.users;

-- Créer les utilisateurs avec mots de passe hashés en SHA-256
-- admin / admin123
INSERT INTO public.users (username, email, password_hash, full_name, role, business_units, active)
VALUES (
    'admin',
    'admin@example.com',
    encode(digest('admin123', 'sha256'), 'hex'),
    'Administrateur Système',
    'admin',
    ARRAY['2025_bu01', '2024_bu01', '2025_bu02', '2009_bu02'],
    true
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = encode(digest('admin123', 'sha256'), 'hex'),
    business_units = ARRAY['2025_bu01', '2024_bu01', '2025_bu02', '2009_bu02'];

-- manager / manager123
INSERT INTO public.users (username, email, password_hash, full_name, role, business_units, active)
VALUES (
    'manager',
    'manager@example.com',
    encode(digest('manager123', 'sha256'), 'hex'),
    'Manager Test',
    'manager',
    ARRAY['2025_bu01', '2009_bu02'],
    true
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = encode(digest('manager123', 'sha256'), 'hex'),
    business_units = ARRAY['2025_bu01', '2009_bu02'];

-- user / user123
INSERT INTO public.users (username, email, password_hash, full_name, role, business_units, active)
VALUES (
    'user',
    'user@example.com',
    encode(digest('user123', 'sha256'), 'hex'),
    'Utilisateur Test',
    'user',
    ARRAY['2025_bu01', '2009_bu02'],
    true
)
ON CONFLICT (username) DO UPDATE SET
    password_hash = encode(digest('user123', 'sha256'), 'hex'),
    business_units = ARRAY['2025_bu01', '2009_bu02'];

-- Vérifier les utilisateurs créés
SELECT 
    id, 
    username, 
    email, 
    full_name, 
    role, 
    business_units,
    active,
    created_at
FROM public.users
ORDER BY id;

-- Message de confirmation
SELECT '✅ Utilisateurs créés avec succès!' as message;
SELECT '📝 Identifiants disponibles:' as info;
SELECT 'admin / admin123 (Administrateur)' as credentials
UNION ALL
SELECT 'manager / manager123 (Manager)'
UNION ALL
SELECT 'user / user123 (Utilisateur)';
