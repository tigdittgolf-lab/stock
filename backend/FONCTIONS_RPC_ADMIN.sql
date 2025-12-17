-- =====================================================
-- FONCTIONS RPC POUR L'ADMINISTRATION SYSTÈME
-- =====================================================

-- ==================== STATISTIQUES ====================

-- Fonction pour récupérer tous les schémas tenants
CREATE OR REPLACE FUNCTION get_all_tenant_schemas()
RETURNS TABLE (
    schema_name TEXT,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schema_name::TEXT,
        NOW() as created_at
    FROM information_schema.schemata s
    WHERE s.schema_name ~ '^\d{4}_bu\d{2}$'
    ORDER BY s.schema_name;
END;
$$;

-- ==================== GESTION DES BUSINESS UNITS ====================

-- Fonction pour récupérer toutes les BU avec leurs informations
CREATE OR REPLACE FUNCTION get_all_business_units()
RETURNS TABLE (
    schema_name TEXT,
    bu_code TEXT,
    year INTEGER,
    nom_entreprise TEXT,
    adresse TEXT,
    telephone TEXT,
    email TEXT,
    nif TEXT,
    rc TEXT,
    activite TEXT,
    slogan TEXT,
    active BOOLEAN,
    created_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_rec RECORD;
    result_rec RECORD;
    table_exists BOOLEAN;
BEGIN
    -- Parcourir tous les schémas tenants
    FOR schema_rec IN 
        SELECT s.schema_name
        FROM information_schema.schemata s
        WHERE s.schema_name ~ '^\d{4}_bu\d{2}$'
        ORDER BY s.schema_name
    LOOP
        -- Vérifier si la table activite existe dans ce schéma
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = schema_rec.schema_name 
            AND table_name = 'activite'
        ) INTO table_exists;
        
        IF table_exists THEN
            BEGIN
                -- Récupérer les infos de la table activite de chaque schéma
                EXECUTE format('
                    SELECT 
                        %L as schema_name,
                        substring(%L from ''bu\d{2}'') as bu_code,
                        substring(%L from ''^\d{4}'')::INTEGER as year,
                        COALESCE(nom_entreprise, raison_sociale, ''ETS BENAMAR BOUZID MENOUAR'') as nom_entreprise,
                        COALESCE(adresse, ''10, Rue Belhandouz A.E.K, Mostaganem'') as adresse,
                        COALESCE(telephone, tel_fixe, tel_port, ''(213)045.42.35.20'') as telephone,
                        COALESCE(email, e_mail, ''outillagesaada@gmail.com'') as email,
                        COALESCE(nif, ident_fiscal, ''10227010185816600000'') as nif,
                        COALESCE(rc, nrc, ''21A3965999-27/00'') as rc,
                        COALESCE(
                            activite,
                            CASE 
                                WHEN domaine_activite IS NOT NULL AND sous_domaine IS NOT NULL 
                                THEN domaine_activite || '' - '' || sous_domaine
                                WHEN domaine_activite IS NOT NULL 
                                THEN domaine_activite
                                ELSE ''Commerce - Outillage et Équipements''
                            END
                        ) as activite,
                        COALESCE(slogan, '''') as slogan,
                        true as active,
                        COALESCE(created_at, NOW()) as created_at
                    FROM %I.activite
                    ORDER BY id
                    LIMIT 1
                ', schema_rec.schema_name, schema_rec.schema_name, schema_rec.schema_name, schema_rec.schema_name)
                INTO result_rec;
                
                IF result_rec IS NOT NULL THEN
                    schema_name := result_rec.schema_name;
                    bu_code := result_rec.bu_code;
                    year := result_rec.year;
                    nom_entreprise := result_rec.nom_entreprise;
                    adresse := result_rec.adresse;
                    telephone := result_rec.telephone;
                    email := result_rec.email;
                    nif := result_rec.nif;
                    rc := result_rec.rc;
                    activite := result_rec.activite;
                    slogan := result_rec.slogan;
                    active := result_rec.active;
                    created_at := result_rec.created_at;
                    RETURN NEXT;
                ELSE
                    -- Si aucune ligne trouvée, utiliser les valeurs par défaut
                    schema_name := schema_rec.schema_name;
                    bu_code := substring(schema_rec.schema_name from 'bu\d{2}');
                    year := substring(schema_rec.schema_name from '^\d{4}')::INTEGER;
                    nom_entreprise := 'ETS BENAMAR BOUZID MENOUAR';
                    adresse := '10, Rue Belhandouz A.E.K, Mostaganem';
                    telephone := '(213)045.42.35.20';
                    email := 'outillagesaada@gmail.com';
                    nif := '10227010185816600000';
                    rc := '21A3965999-27/00';
                    activite := 'Commerce - Outillage et Équipements';
                    slogan := '';
                    active := true;
                    created_at := NOW();
                    RETURN NEXT;
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    -- En cas d'erreur, utiliser les valeurs par défaut
                    schema_name := schema_rec.schema_name;
                    bu_code := substring(schema_rec.schema_name from 'bu\d{2}');
                    year := substring(schema_rec.schema_name from '^\d{4}')::INTEGER;
                    nom_entreprise := 'ETS BENAMAR BOUZID MENOUAR';
                    adresse := '10, Rue Belhandouz A.E.K, Mostaganem';
                    telephone := '(213)045.42.35.20';
                    email := 'outillagesaada@gmail.com';
                    nif := '10227010185816600000';
                    rc := '21A3965999-27/00';
                    activite := 'Commerce - Outillage et Équipements';
                    slogan := '';
                    active := true;
                    created_at := NOW();
                    RETURN NEXT;
            END;
        ELSE
            -- Si la table n'existe pas, utiliser les valeurs par défaut
            schema_name := schema_rec.schema_name;
            bu_code := substring(schema_rec.schema_name from 'bu\d{2}');
            year := substring(schema_rec.schema_name from '^\d{4}')::INTEGER;
            nom_entreprise := 'ETS BENAMAR BOUZID MENOUAR';
            adresse := '10, Rue Belhandouz A.E.K, Mostaganem';
            telephone := '(213)045.42.35.20';
            email := 'outillagesaada@gmail.com';
            nif := '10227010185816600000';
            rc := '21A3965999-27/00';
            activite := 'Commerce - Outillage et Équipements';
            slogan := '';
            active := true;
            created_at := NOW();
            RETURN NEXT;
        END IF;
    END LOOP;
END;
$$;

-- Fonction pour créer une nouvelle BU
CREATE OR REPLACE FUNCTION create_business_unit(
    p_bu_code TEXT,
    p_year INTEGER,
    p_nom_entreprise TEXT,
    p_adresse TEXT DEFAULT '',
    p_telephone TEXT DEFAULT '',
    p_email TEXT DEFAULT '',
    p_nif TEXT DEFAULT '',
    p_rc TEXT DEFAULT '',
    p_activite TEXT DEFAULT '',
    p_slogan TEXT DEFAULT ''
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_schema TEXT;
    v_result JSON;
BEGIN
    -- Construire le nom du schéma
    v_schema := p_year || '_' || p_bu_code;
    
    -- Vérifier si le schéma existe déjà
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = v_schema) THEN
        RAISE EXCEPTION 'Business Unit % existe déjà', v_schema;
    END IF;
    
    -- Créer le schéma
    EXECUTE format('CREATE SCHEMA %I', v_schema);
    
    -- Créer la table activite dans le nouveau schéma
    EXECUTE format('
        CREATE TABLE %I.activite (
            id SERIAL PRIMARY KEY,
            code_activite VARCHAR(50),
            domaine_activite VARCHAR(255),
            sous_domaine VARCHAR(255),
            raison_sociale VARCHAR(255),
            adresse TEXT,
            commune VARCHAR(100),
            wilaya VARCHAR(100),
            tel_fixe VARCHAR(50),
            tel_port VARCHAR(50),
            nrc VARCHAR(100),
            nis VARCHAR(100),
            nart VARCHAR(100),
            ident_fiscal VARCHAR(100),
            banq VARCHAR(255),
            entete_bon TEXT,
            e_mail VARCHAR(255),
            nom_entreprise VARCHAR(255),
            telephone VARCHAR(50),
            email VARCHAR(255),
            nif VARCHAR(100),
            rc VARCHAR(100),
            logo_url TEXT,
            slogan TEXT,
            activite TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ', v_schema);
    
    -- Insérer les informations de l'entreprise
    EXECUTE format('
        INSERT INTO %I.activite (
            nom_entreprise, adresse, telephone, email, nif, rc, activite, slogan
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ', v_schema)
    USING p_nom_entreprise, p_adresse, p_telephone, p_email, p_nif, p_rc, p_activite, p_slogan;
    
    -- Créer les autres tables nécessaires (famille, article, client, fournisseur, etc.)
    -- Table famille
    EXECUTE format('
        CREATE TABLE %I.famille (
            famille VARCHAR(255) PRIMARY KEY,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ', v_schema);
    
    -- Table article
    EXECUTE format('
        CREATE TABLE %I.article (
            Narticle SERIAL PRIMARY KEY,
            designation VARCHAR(255) NOT NULL,
            famille VARCHAR(255),
            prix_achat DECIMAL(15,2) DEFAULT 0,
            prix_vente DECIMAL(15,2) DEFAULT 0,
            stock_f INTEGER DEFAULT 0,
            stock_bl INTEGER DEFAULT 0,
            seuil_min INTEGER DEFAULT 0,
            unite VARCHAR(50) DEFAULT ''pièce'',
            tva DECIMAL(5,2) DEFAULT 19,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (famille) REFERENCES %I.famille(famille)
        )
    ', v_schema, v_schema);
    
    -- Table client
    EXECUTE format('
        CREATE TABLE %I.client (
            Nclient SERIAL PRIMARY KEY,
            nom VARCHAR(255) NOT NULL,
            prenom VARCHAR(255),
            adresse TEXT,
            telephone VARCHAR(50),
            email VARCHAR(255),
            nif VARCHAR(100),
            rc VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ', v_schema);
    
    -- Table fournisseur
    EXECUTE format('
        CREATE TABLE %I.fournisseur (
            Nfournisseur SERIAL PRIMARY KEY,
            nom VARCHAR(255) NOT NULL,
            adresse TEXT,
            telephone VARCHAR(50),
            email VARCHAR(255),
            nif VARCHAR(100),
            rc VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ', v_schema);
    
    v_result := json_build_object(
        'schema', v_schema,
        'bu_code', p_bu_code,
        'year', p_year,
        'nom_entreprise', p_nom_entreprise,
        'created', true
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la création de la BU: %', SQLERRM;
END;
$$;

-- Fonction pour mettre à jour une BU
CREATE OR REPLACE FUNCTION update_business_unit(
    p_schema TEXT,
    p_nom_entreprise TEXT,
    p_adresse TEXT,
    p_telephone TEXT,
    p_email TEXT,
    p_nif TEXT,
    p_rc TEXT,
    p_activite TEXT,
    p_slogan TEXT,
    p_active BOOLEAN DEFAULT true
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier si le schéma existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = p_schema) THEN
        RAISE EXCEPTION 'Business Unit % n''existe pas', p_schema;
    END IF;
    
    -- Mettre à jour la table activite
    EXECUTE format('
        UPDATE %I.activite 
        SET 
            nom_entreprise = $1,
            adresse = $2,
            telephone = $3,
            email = $4,
            nif = $5,
            rc = $6,
            activite = $7,
            slogan = $8,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = (SELECT MIN(id) FROM %I.activite)
    ', p_schema, p_schema)
    USING p_nom_entreprise, p_adresse, p_telephone, p_email, p_nif, p_rc, p_activite, p_slogan;
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la mise à jour de la BU: %', SQLERRM;
END;
$$;

-- Fonction pour supprimer une BU (ATTENTION: supprime tout le schéma!)
CREATE OR REPLACE FUNCTION delete_business_unit(p_schema TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Vérifier si le schéma existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = p_schema) THEN
        RAISE EXCEPTION 'Business Unit % n''existe pas', p_schema;
    END IF;
    
    -- Supprimer le schéma et tout son contenu
    EXECUTE format('DROP SCHEMA %I CASCADE', p_schema);
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la suppression de la BU: %', SQLERRM;
END;
$$;

-- ==================== GESTION DES UTILISATEURS ====================

-- Table pour stocker les utilisateurs (dans le schéma public)
CREATE TABLE IF NOT EXISTS public.users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user', -- 'admin', 'manager', 'user'
    business_units TEXT[], -- Array des BU auxquelles l'utilisateur a accès
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Fonction pour récupérer tous les utilisateurs
CREATE OR REPLACE FUNCTION get_all_users()
RETURNS TABLE (
    id INTEGER,
    username VARCHAR,
    email VARCHAR,
    full_name VARCHAR,
    role VARCHAR,
    business_units TEXT[],
    active BOOLEAN,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.email,
        u.full_name,
        u.role,
        u.business_units,
        u.active,
        u.created_at,
        u.updated_at
    FROM public.users u
    ORDER BY u.created_at DESC;
END;
$$;

-- Fonction pour créer un utilisateur
CREATE OR REPLACE FUNCTION create_user(
    p_username VARCHAR,
    p_email VARCHAR,
    p_password VARCHAR,
    p_full_name VARCHAR DEFAULT '',
    p_role VARCHAR DEFAULT 'user',
    p_business_units TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id INTEGER;
    v_result JSON;
BEGIN
    -- Insérer l'utilisateur (le password devrait être hashé côté backend)
    INSERT INTO public.users (
        username, email, password_hash, full_name, role, business_units
    ) VALUES (
        p_username, p_email, p_password, p_full_name, p_role, p_business_units
    )
    RETURNING id INTO v_user_id;
    
    v_result := json_build_object(
        'id', v_user_id,
        'username', p_username,
        'email', p_email,
        'created', true
    );
    
    RETURN v_result;
    
EXCEPTION
    WHEN unique_violation THEN
        RAISE EXCEPTION 'Username ou email déjà utilisé';
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la création de l''utilisateur: %', SQLERRM;
END;
$$;

-- Fonction pour mettre à jour un utilisateur
CREATE OR REPLACE FUNCTION update_user(
    p_user_id INTEGER,
    p_username VARCHAR,
    p_email VARCHAR,
    p_full_name VARCHAR,
    p_role VARCHAR,
    p_business_units TEXT[],
    p_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.users
    SET 
        username = p_username,
        email = p_email,
        full_name = p_full_name,
        role = p_role,
        business_units = p_business_units,
        active = p_active,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Utilisateur % non trouvé', p_user_id;
    END IF;
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la mise à jour de l''utilisateur: %', SQLERRM;
END;
$$;

-- Fonction pour supprimer un utilisateur
CREATE OR REPLACE FUNCTION delete_user(p_user_id INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.users WHERE id = p_user_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Utilisateur % non trouvé', p_user_id;
    END IF;
    
    RETURN true;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la suppression de l''utilisateur: %', SQLERRM;
END;
$$;

-- Accorder les permissions
GRANT EXECUTE ON FUNCTION get_all_tenant_schemas TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_business_units TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_business_unit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_business_unit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_business_unit TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_all_users TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION delete_user TO anon, authenticated;

-- Créer un utilisateur admin par défaut (password: admin123)
INSERT INTO public.users (username, email, password_hash, full_name, role, business_units)
VALUES ('admin', 'admin@example.com', 'admin123', 'Administrateur Système', 'admin', ARRAY['2025_bu01'])
ON CONFLICT (username) DO NOTHING;
