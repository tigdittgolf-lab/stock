-- Fonctions RPC pour la gestion des familles d'articles

-- 1. Fonction pour récupérer les familles
CREATE OR REPLACE FUNCTION get_families(p_tenant TEXT)
RETURNS JSON AS $
DECLARE
    result JSON;
    query_text TEXT;
BEGIN
    -- Construire la requête dynamique
    query_text := format('SELECT json_agg(row_to_json(t)) FROM (SELECT * FROM %I.famille_art ORDER BY famille) t', p_tenant);
    
    -- Exécuter la requête
    EXECUTE query_text INTO result;
    
    -- Retourner le résultat ou un tableau vide si null
    RETURN COALESCE(result, '[]'::json);
    
EXCEPTION
    WHEN OTHERS THEN
        -- En cas d'erreur, retourner un tableau vide
        RETURN '[]'::json;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fonction pour créer une famille
CREATE OR REPLACE FUNCTION create_family(
    p_tenant TEXT,
    p_famille TEXT
)
RETURNS JSON AS $
DECLARE
    result JSON;
    query_text TEXT;
BEGIN
    -- Vérifier si la famille existe déjà
    query_text := format('SELECT COUNT(*) FROM %I.famille_art WHERE famille = $1', p_tenant);
    EXECUTE query_text USING p_famille INTO result;
    
    IF result::int > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cette famille existe déjà'
        );
    END IF;
    
    -- Insérer la nouvelle famille
    query_text := format('INSERT INTO %I.famille_art (famille) VALUES ($1) RETURNING *', p_tenant);
    EXECUTE query_text USING p_famille INTO result;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Famille créée avec succès',
        'data', result
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la création de la famille: ' || SQLERRM
        );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fonction pour supprimer une famille
CREATE OR REPLACE FUNCTION delete_family(
    p_tenant TEXT,
    p_famille TEXT
)
RETURNS JSON AS $
DECLARE
    result_count INTEGER;
    query_text TEXT;
BEGIN
    -- Vérifier si la famille est utilisée par des articles
    query_text := format('SELECT COUNT(*) FROM %I.article WHERE famille = $1', p_tenant);
    EXECUTE query_text USING p_famille INTO result_count;
    
    IF result_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Impossible de supprimer cette famille car elle est utilisée par ' || result_count || ' article(s)'
        );
    END IF;
    
    -- Supprimer la famille
    query_text := format('DELETE FROM %I.famille_art WHERE famille = $1', p_tenant);
    EXECUTE query_text USING p_famille;
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    IF result_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Famille non trouvée'
        );
    END IF;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Famille supprimée avec succès'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la suppression de la famille: ' || SQLERRM
        );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Fonction pour mettre à jour une famille
CREATE OR REPLACE FUNCTION update_family(
    p_tenant TEXT,
    p_old_famille TEXT,
    p_new_famille TEXT
)
RETURNS JSON AS $
DECLARE
    result_count INTEGER;
    query_text TEXT;
BEGIN
    -- Vérifier si la nouvelle famille existe déjà
    query_text := format('SELECT COUNT(*) FROM %I.famille_art WHERE famille = $1 AND famille != $2', p_tenant);
    EXECUTE query_text USING p_new_famille, p_old_famille INTO result_count;
    
    IF result_count > 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Une famille avec ce nom existe déjà'
        );
    END IF;
    
    -- Mettre à jour la famille
    query_text := format('UPDATE %I.famille_art SET famille = $1 WHERE famille = $2', p_tenant);
    EXECUTE query_text USING p_new_famille, p_old_famille;
    
    GET DIAGNOSTICS result_count = ROW_COUNT;
    
    IF result_count = 0 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Famille non trouvée'
        );
    END IF;
    
    -- Mettre à jour les articles qui utilisent cette famille
    query_text := format('UPDATE %I.article SET famille = $1 WHERE famille = $2', p_tenant);
    EXECUTE query_text USING p_new_famille, p_old_famille;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Famille mise à jour avec succès'
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Erreur lors de la mise à jour de la famille: ' || SQLERRM
        );
END;
$ LANGUAGE plpgsql SECURITY DEFINER;