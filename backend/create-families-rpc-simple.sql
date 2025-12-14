-- Fonctions RPC simplifiées pour les familles
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Fonction pour récupérer les familles
CREATE OR REPLACE FUNCTION get_families_by_tenant(p_tenant TEXT)
RETURNS TABLE(famille VARCHAR(50))
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('SELECT famille FROM %I.famille_art ORDER BY famille', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        -- Si erreur, retourner un tableau vide
        RETURN;
END;
$$;

-- 2. Fonction pour insérer une famille
CREATE OR REPLACE FUNCTION insert_family_to_tenant(
    p_tenant TEXT,
    p_famille VARCHAR(50)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('INSERT INTO %I.famille_art (famille) VALUES (%L)', p_tenant, p_famille);
    RETURN 'Famille créée avec succès: ' || p_famille;
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'ERREUR: La famille "' || p_famille || '" existe déjà';
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 3. Fonction pour modifier une famille
CREATE OR REPLACE FUNCTION update_family_in_tenant(
    p_tenant TEXT,
    p_old_famille VARCHAR(50),
    p_new_famille VARCHAR(50)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Mettre à jour la famille dans famille_art
    EXECUTE format('UPDATE %I.famille_art SET famille = %L WHERE famille = %L', 
                   p_tenant, p_new_famille, p_old_famille);
    
    -- Mettre à jour les articles qui utilisent cette famille
    EXECUTE format('UPDATE %I.article SET famille = %L WHERE famille = %L', 
                   p_tenant, p_new_famille, p_old_famille);
    
    RETURN 'Famille modifiée avec succès: ' || p_old_famille || ' → ' || p_new_famille;
EXCEPTION
    WHEN unique_violation THEN
        RETURN 'ERREUR: La famille "' || p_new_famille || '" existe déjà';
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 4. Fonction pour supprimer une famille
CREATE OR REPLACE FUNCTION delete_family_from_tenant(
    p_tenant TEXT,
    p_famille VARCHAR(50)
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    article_count INTEGER;
BEGIN
    -- Vérifier si des articles utilisent cette famille
    EXECUTE format('SELECT COUNT(*) FROM %I.article WHERE famille = %L', p_tenant, p_famille)
    INTO article_count;
    
    IF article_count > 0 THEN
        RETURN 'ERREUR: Impossible de supprimer la famille "' || p_famille || '". ' || 
               article_count || ' article(s) l''utilisent encore.';
    END IF;
    
    -- Supprimer la famille
    EXECUTE format('DELETE FROM %I.famille_art WHERE famille = %L', p_tenant, p_famille);
    
    RETURN 'Famille supprimée avec succès: ' || p_famille;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;