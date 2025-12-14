-- Fonction pour vérifier les familles dans un tenant
CREATE OR REPLACE FUNCTION get_families_by_tenant(p_tenant TEXT)
RETURNS TABLE(famille VARCHAR(50))
SECURITY DEFINER
LANGUAGE plpgsql
AS $
BEGIN
    RETURN QUERY EXECUTE format('SELECT DISTINCT famille FROM %I.famille_art ORDER BY famille', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        -- Si la table n'existe pas, retourner des familles par défaut
        RETURN QUERY SELECT unnest(ARRAY['Electricité', 'Droguerie', 'Peinture', 'Outillage', 'Plomberie', 'Carrelage']::VARCHAR(50)[]);
END;
$;