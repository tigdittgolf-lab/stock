-- =====================================================
-- CORRECTION : Ajouter la colonne last_login à la table users
-- =====================================================

-- Ajouter la colonne last_login si elle n'existe pas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'last_login'
    ) THEN
        ALTER TABLE public.users ADD COLUMN last_login TIMESTAMP;
        RAISE NOTICE '✅ Colonne last_login ajoutée à la table users';
    ELSE
        RAISE NOTICE 'ℹ️ Colonne last_login existe déjà';
    END IF;
END $$;

-- Vérifier que toutes les colonnes nécessaires existent
DO $$
DECLARE
    missing_columns TEXT[] := '{}';
BEGIN
    -- Vérifier chaque colonne
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'id') THEN
        missing_columns := array_append(missing_columns, 'id');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'username') THEN
        missing_columns := array_append(missing_columns, 'username');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email') THEN
        missing_columns := array_append(missing_columns, 'email');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password_hash') THEN
        missing_columns := array_append(missing_columns, 'password_hash');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') THEN
        missing_columns := array_append(missing_columns, 'full_name');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
        missing_columns := array_append(missing_columns, 'role');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'business_units') THEN
        missing_columns := array_append(missing_columns, 'business_units');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'active') THEN
        missing_columns := array_append(missing_columns, 'active');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'created_at') THEN
        missing_columns := array_append(missing_columns, 'created_at');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'updated_at') THEN
        missing_columns := array_append(missing_columns, 'updated_at');
    END IF;
    
    -- Afficher le résultat
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE WARNING '⚠️ Colonnes manquantes dans la table users: %', array_to_string(missing_columns, ', ');
        RAISE NOTICE '💡 Exécutez le script SYSTEME_AUTHENTIFICATION.sql complet pour créer toutes les colonnes';
    ELSE
        RAISE NOTICE '✅ Toutes les colonnes nécessaires existent dans la table users';
    END IF;
END $$;

-- Afficher la structure actuelle de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;
