-- =====================================================
-- SYSTÈME DE RÉCUPÉRATION DE MOT DE PASSE
-- =====================================================

-- Table pour les tokens de récupération de mot de passe
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES public.users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON public.password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON public.password_reset_tokens(expires_at);

-- Fonction pour demander une réinitialisation de mot de passe
CREATE OR REPLACE FUNCTION request_password_reset(p_email_or_username VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user RECORD;
    v_token VARCHAR(255);
    v_expires_at TIMESTAMP;
    v_result JSON;
BEGIN
    -- Récupérer l'utilisateur par email ou username
    SELECT id, username, email, full_name, active
    INTO v_user
    FROM public.users
    WHERE (email = p_email_or_username OR username = p_email_or_username) AND active = true;
    
    IF NOT FOUND THEN
        -- Ne pas révéler si l'utilisateur existe ou non (sécurité)
        RETURN json_build_object(
            'success', true,
            'message', 'Si cet utilisateur existe, un email de récupération a été envoyé'
        );
    END IF;
    
    -- Générer un token unique (en production, utiliser une fonction crypto sécurisée)
    v_token := 'reset_' || v_user.id || '_' || extract(epoch from now())::bigint || '_' || floor(random() * 1000000)::text;
    v_expires_at := CURRENT_TIMESTAMP + INTERVAL '1 hour'; -- Token valide 1 heure
    
    -- Invalider les anciens tokens
    UPDATE public.password_reset_tokens 
    SET used = true 
    WHERE user_id = v_user.id AND used = false;
    
    -- Créer le nouveau token
    INSERT INTO public.password_reset_tokens (user_id, token, expires_at)
    VALUES (v_user.id, v_token, v_expires_at);
    
    -- Logger la demande
    INSERT INTO public.system_logs (user_id, username, level, action, details)
    VALUES (v_user.id, v_user.username, 'info', 'PASSWORD_RESET_REQUEST', 'Demande de réinitialisation de mot de passe');
    
    -- En production, envoyer un email ici
    -- Pour le développement, retourner le token (À SUPPRIMER EN PRODUCTION!)
    v_result := json_build_object(
        'success', true,
        'message', 'Un email de récupération a été envoyé',
        'dev_token', v_token, -- À SUPPRIMER EN PRODUCTION!
        'dev_expires_at', v_expires_at -- À SUPPRIMER EN PRODUCTION!
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la demande de récupération: ' || SQLERRM
        );
END;
$$;

-- Fonction pour valider un token de récupération
CREATE OR REPLACE FUNCTION validate_reset_token(p_token VARCHAR)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_record RECORD;
    v_user RECORD;
    v_result JSON;
BEGIN
    -- Récupérer le token
    SELECT t.*, u.username, u.email, u.full_name
    INTO v_token_record
    FROM public.password_reset_tokens t
    JOIN public.users u ON t.user_id = u.id
    WHERE t.token = p_token 
      AND t.used = false 
      AND t.expires_at > CURRENT_TIMESTAMP
      AND u.active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token invalide ou expiré'
        );
    END IF;
    
    v_result := json_build_object(
        'success', true,
        'user', json_build_object(
            'id', v_token_record.user_id,
            'username', v_token_record.username,
            'email', v_token_record.email,
            'full_name', v_token_record.full_name
        )
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la validation du token: ' || SQLERRM
        );
END;
$$;

-- Fonction pour réinitialiser le mot de passe
CREATE OR REPLACE FUNCTION reset_password(
    p_token VARCHAR,
    p_new_password VARCHAR
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_token_record RECORD;
    v_result JSON;
BEGIN
    -- Valider le token
    SELECT t.*, u.username
    INTO v_token_record
    FROM public.password_reset_tokens t
    JOIN public.users u ON t.user_id = u.id
    WHERE t.token = p_token 
      AND t.used = false 
      AND t.expires_at > CURRENT_TIMESTAMP
      AND u.active = true;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Token invalide ou expiré'
        );
    END IF;
    
    -- Mettre à jour le mot de passe (en production, hasher avec bcrypt!)
    UPDATE public.users
    SET 
        password_hash = p_new_password, -- À HASHER EN PRODUCTION!
        updated_at = CURRENT_TIMESTAMP
    WHERE id = v_token_record.user_id;
    
    -- Marquer le token comme utilisé
    UPDATE public.password_reset_tokens
    SET used = true
    WHERE id = v_token_record.id;
    
    -- Invalider toutes les sessions actives de cet utilisateur (sécurité)
    DELETE FROM public.user_sessions
    WHERE user_id = v_token_record.user_id;
    
    -- Logger l'action
    INSERT INTO public.system_logs (user_id, username, level, action, details)
    VALUES (v_token_record.user_id, v_token_record.username, 'success', 'PASSWORD_RESET', 'Mot de passe réinitialisé avec succès');
    
    v_result := json_build_object(
        'success', true,
        'message', 'Mot de passe réinitialisé avec succès'
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la réinitialisation: ' || SQLERRM
        );
END;
$$;

-- Fonction pour nettoyer les tokens expirés
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM public.password_reset_tokens 
    WHERE expires_at < CURRENT_TIMESTAMP OR used = true;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION request_password_reset TO anon, authenticated;
GRANT EXECUTE ON FUNCTION validate_reset_token TO anon, authenticated;
GRANT EXECUTE ON FUNCTION reset_password TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cleanup_expired_reset_tokens TO anon, authenticated;

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE '✅ Système de récupération de mot de passe créé avec succès !';
    RAISE NOTICE '📧 Fonctions disponibles:';
    RAISE NOTICE '   - request_password_reset(email_or_username)';
    RAISE NOTICE '   - validate_reset_token(token)';
    RAISE NOTICE '   - reset_password(token, new_password)';
    RAISE NOTICE '   - cleanup_expired_reset_tokens()';
    RAISE NOTICE '⚠️  IMPORTANT: En production, hasher les mots de passe et envoyer de vrais emails !';
END $$;