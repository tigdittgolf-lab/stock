-- =====================================================
-- FONCTION RPC ADMIN SIMPLIFIÉE POUR LIRE LES BU EXISTANTES
-- =====================================================

-- Supprimer l'ancienne fonction si elle existe
DROP FUNCTION IF EXISTS get_all_business_units();

-- Fonction pour récupérer toutes les BU avec leurs informations (VERSION SIMPLIFIÉE)
CREATE OR REPLACE FUNCTION get_all_business_units()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_rec RECORD;
    result_json JSON;
    bu_array JSON[] := '{}';
    bu_data JSON;
BEGIN
    -- Parcourir tous les schémas tenants
    FOR schema_rec IN 
        SELECT s.schema_name
        FROM information_schema.schemata s
        WHERE s.schema_name ~ '^\d{4}_bu\d{2}$'
        ORDER BY s.schema_name
    LOOP
        BEGIN
            -- Utiliser la même logique que get_tenant_activite
            EXECUTE format('
                SELECT json_build_object(
                    ''schema_name'', %L,
                    ''bu_code'', substring(%L from ''bu\d{2}''),
                    ''year'', substring(%L from ''^\d{4}'')::INTEGER,
                    ''nom_entreprise'', COALESCE(nom_entreprise, raison_sociale, ''ETS BENAMAR BOUZID MENOUAR''),
                    ''adresse'', COALESCE(adresse, '''') || 
                        CASE WHEN commune IS NOT NULL THEN '', '' || commune ELSE '''' END ||
                        CASE WHEN wilaya IS NOT NULL THEN '', '' || wilaya ELSE '''' END,
                    ''telephone'', COALESCE(telephone, tel_fixe, tel_port, ''''),
                    ''email'', COALESCE(email, e_mail, ''''),
                    ''nif'', COALESCE(nif, ident_fiscal, ''''),
                    ''rc'', COALESCE(rc, nrc, ''''),
                    ''activite'', COALESCE(activite, 
                        CASE 
                            WHEN domaine_activite IS NOT NULL AND sous_domaine IS NOT NULL 
                            THEN domaine_activite || '' - '' || sous_domaine
                            WHEN domaine_activite IS NOT NULL 
                            THEN domaine_activite
                            ELSE ''''
                        END
                    ),
                    ''slogan'', COALESCE(slogan, ''''),
                    ''active'', true,
                    ''created_at'', COALESCE(created_at::text, CURRENT_TIMESTAMP::text)
                )
                FROM %I.activite
                ORDER BY id
                LIMIT 1
            ', schema_rec.schema_name, schema_rec.schema_name, schema_rec.schema_name, schema_rec.schema_name)
            INTO bu_data;
            
            IF bu_data IS NOT NULL THEN
                bu_array := array_append(bu_array, bu_data);
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- En cas d'erreur, créer une entrée avec les données par défaut
                bu_data := json_build_object(
                    'schema_name', schema_rec.schema_name,
                    'bu_code', substring(schema_rec.schema_name from 'bu\d{2}'),
                    'year', substring(schema_rec.schema_name from '^\d{4}')::INTEGER,
                    'nom_entreprise', 'ETS BENAMAR BOUZID MENOUAR',
                    'adresse', '10, Rue Belhandouz A.E.K, Mostaganem',
                    'telephone', '(213)045.42.35.20',
                    'email', 'outillagesaada@gmail.com',
                    'nif', '10227010185816600000',
                    'rc', '21A3965999-27/00',
                    'activite', 'Commerce - Outillage et Équipements',
                    'slogan', '',
                    'active', true,
                    'created_at', CURRENT_TIMESTAMP::text
                );
                bu_array := array_append(bu_array, bu_data);
        END;
    END LOOP;
    
    -- Convertir le tableau en JSON
    result_json := array_to_json(bu_array);
    
    RETURN COALESCE(result_json, '[]'::json);
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN '[]'::json;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_all_business_units TO anon, authenticated;
