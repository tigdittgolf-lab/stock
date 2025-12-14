-- FONCTIONS RPC POUR LE MODULE RÉGLAGES
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- ==================== FAMILLES D'ARTICLES ====================

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
        -- Si la table n'existe pas, retourner des familles par défaut
        RETURN QUERY SELECT unnest(ARRAY['Electricité', 'Droguerie', 'Peinture', 'Outillage', 'Plomberie', 'Carrelage']::VARCHAR(50)[]);
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
    EXECUTE format('
        INSERT INTO %I.famille_art (famille) VALUES (%L)',
        p_tenant, p_famille
    );
    
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
    EXECUTE format('
        UPDATE %I.famille_art SET famille = %L WHERE famille = %L',
        p_tenant, p_new_famille, p_old_famille
    );
    
    -- Mettre à jour les articles qui utilisent cette famille
    EXECUTE format('
        UPDATE %I.article SET famille = %L WHERE famille = %L',
        p_tenant, p_new_famille, p_old_famille
    );
    
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
        RETURN 'ERREUR: Impossible de supprimer la famille "' || p_famille || '". ' || article_count || ' article(s) l''utilisent encore.';
    END IF;
    
    -- Supprimer la famille
    EXECUTE format('DELETE FROM %I.famille_art WHERE famille = %L', p_tenant, p_famille);
    
    RETURN 'Famille supprimée avec succès: ' || p_famille;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- ==================== INFORMATIONS ENTREPRISE ====================

-- 5. Fonction pour mettre à jour les informations entreprise
CREATE OR REPLACE FUNCTION update_company_info(
    p_tenant TEXT,
    p_nom_entreprise VARCHAR(100),
    p_adresse TEXT,
    p_telephone VARCHAR(20),
    p_email VARCHAR(100),
    p_nif VARCHAR(50),
    p_rc VARCHAR(50),
    p_activite VARCHAR(200),
    p_slogan TEXT
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('
        UPDATE %I.activite SET
            nom_entreprise = %L,
            adresse = %L,
            telephone = %L,
            email = %L,
            nif = %L,
            rc = %L,
            activite = %L,
            slogan = %L
        WHERE code_activite = ''BU01''',
        p_tenant,
        p_nom_entreprise, p_adresse, p_telephone, p_email,
        p_nif, p_rc, p_activite, p_slogan
    );
    
    RETURN 'Informations entreprise mises à jour avec succès';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- ==================== UNITÉS DE MESURE ====================

-- 6. Fonction pour récupérer les unités (si la table existe)
CREATE OR REPLACE FUNCTION get_units_by_tenant(p_tenant TEXT)
RETURNS TABLE(unite VARCHAR(20), description VARCHAR(100))
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('SELECT unite, description FROM %I.unites ORDER BY unite', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        -- Si la table n'existe pas, retourner des unités par défaut
        RETURN QUERY SELECT * FROM (VALUES 
            ('pièce', 'Pièce'),
            ('kg', 'Kilogramme'),
            ('m', 'Mètre'),
            ('litre', 'Litre'),
            ('m²', 'Mètre carré'),
            ('boîte', 'Boîte')
        ) AS default_units(unite, description);
END;
$$;