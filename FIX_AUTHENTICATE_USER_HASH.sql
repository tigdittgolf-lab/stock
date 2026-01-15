-- ============================================
-- FIX: Fonction authenticate_user avec hash SHA-256
-- ============================================
-- Problème: La fonction compare password_hash (hashé) avec p_password (clair)
-- Solution: Hasher p_password avant la comparaison
-- ============================================

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
    v_password_hash TEXT;
BEGIN
    -- Hasher le mot de passe fourni avec SHA-256 (même méthode que lors de la création)
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

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION authenticate_user TO anon, authenticated;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Fonction authenticate_user corrigée avec hash SHA-256 !';
    RAISE NOTICE '🔐 Le mot de passe est maintenant hashé avant la comparaison';
    RAISE NOTICE '📝 Compatible avec les utilisateurs créés via l''admin';
END $$;
