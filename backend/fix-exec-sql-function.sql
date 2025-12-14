-- Corriger la fonction exec_sql pour qu'elle retourne les vrais résultats
-- Exécutez ce script dans l'éditeur SQL de Supabase

-- Fonction exec_sql corrigée qui retourne les vrais résultats
CREATE OR REPLACE FUNCTION exec_sql(sql TEXT)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    result JSON;
    rec RECORD;
    results JSON[] := '{}';
BEGIN
    -- Pour les requêtes SELECT, retourner les résultats
    IF UPPER(TRIM(sql)) LIKE 'SELECT%' THEN
        FOR rec IN EXECUTE sql LOOP
            results := results || row_to_json(rec);
        END LOOP;
        RETURN array_to_json(results);
    ELSE
        -- Pour les autres requêtes (INSERT, UPDATE, DELETE), juste exécuter
        EXECUTE sql;
        RETURN '{"success": true}'::JSON;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object('error', SQLERRM);
END;
$$;

-- Fonction pour vider complètement une table
CREATE OR REPLACE FUNCTION truncate_table(p_schema TEXT, p_table TEXT)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    EXECUTE format('TRUNCATE TABLE %I.%I CASCADE;', p_schema, p_table);
    RETURN 'Table ' || p_schema || '.' || p_table || ' vidée avec succès';
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;