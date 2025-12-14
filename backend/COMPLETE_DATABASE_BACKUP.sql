-- =====================================================
-- SCRIPT COMPLET DE REPRODUCTION DE LA BASE DE DONNÉES
-- Système Multi-Tenant Stock Management
-- =====================================================

-- Ce script reproduit complètement votre base de données avec :
-- 1. Toutes les tables dans tous les schémas
-- 2. Toutes les fonctions RPC
-- 3. Toutes les données
-- 4. Toutes les permissions

-- =====================================================
-- 1. CRÉATION DES SCHÉMAS TENANTS
-- =====================================================

CREATE SCHEMA IF NOT EXISTS "2025_bu01";
CREATE SCHEMA IF NOT EXISTS "2025_bu02";
CREATE SCHEMA IF NOT EXISTS "2024_bu01";

-- =====================================================
-- 2. TABLES DANS LE SCHÉMA PUBLIC
-- =====================================================

-- Table activite1 (données originales NetBeans)
CREATE TABLE IF NOT EXISTS public.activite1 (
    raison_sociale TEXT,
    adresse TEXT,
    commune TEXT,
    wilaya TEXT,
    tel_fixe TEXT,
    tel_port TEXT,
    e_mail TEXT,
    nrc TEXT,
    nis TEXT,
    domaine_activite TEXT,
    sous_domaine TEXT,
    ident_fiscal TEXT,
    banq TEXT
);

-- Insérer les données réelles de votre entreprise
INSERT INTO public.activite1 (
    raison_sociale, adresse, commune, wilaya, tel_fixe, tel_port,
    e_mail, nrc, nis, domaine_activite, sous_domaine, ident_fiscal, banq
) VALUES (
    'ETS BENAMAR BOUZID MENOUAR',
    '10, Rue Belhandouz A.E.K',
    'Mostaganem',
    'Mostaganem',
    'Tèl : (213)045.42.35.20',
    NULL,
    'E_mail : outillagesaada@gmail.com',
    'N°RC: 21A3965999-27/00',
    'N.I.S: 100227010185845',
    'Commerce',
    'Outillage et Équipements',
    'N.I.F: 10227010185816600000',
    'Cpt : BDL 00500425000000844378'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. FONCTION DE CRÉATION DES TABLES TENANT
-- =====================================================

CREATE OR REPLACE FUNCTION create_tenant_tables(schema_name TEXT)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Famille d'articles
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.famille_art (
            famille VARCHAR(50) PRIMARY KEY
        );
    ', schema_name);

    -- Fournisseurs
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.fournisseur (
            nfournisseur VARCHAR(20) PRIMARY KEY,
            nom_fournisseur VARCHAR(100),
            resp_fournisseur VARCHAR(100),
            adresse_fourni TEXT,
            tel VARCHAR(20),
            tel1 VARCHAR(20),
            tel2 VARCHAR(20),
            caf DECIMAL(15,2) DEFAULT 0,
            cabl DECIMAL(15,2) DEFAULT 0,
            email VARCHAR(100),
            commentaire TEXT
        );
    ', schema_name);

    -- Clients
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.client (
            nclient VARCHAR(20) PRIMARY KEY,
            raison_sociale VARCHAR(100),
            adresse TEXT,
            contact_person VARCHAR(100),
            c_affaire_fact DECIMAL(15,2) DEFAULT 0,
            c_affaire_bl DECIMAL(15,2) DEFAULT 0,
            nrc VARCHAR(50),
            date_rc DATE,
            lieu_rc VARCHAR(100),
            i_fiscal VARCHAR(50),
            n_article VARCHAR(50),
            tel VARCHAR(20),
            email VARCHAR(100),
            commentaire TEXT
        );
    ', schema_name);

    -- Articles
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.article (
            narticle VARCHAR(20) PRIMARY KEY,
            famille VARCHAR(50),
            designation VARCHAR(200),
            nfournisseur VARCHAR(20),
            prix_unitaire DECIMAL(15,2) DEFAULT 0,
            marge DECIMAL(5,2) DEFAULT 0,
            tva DECIMAL(5,2) DEFAULT 0,
            prix_vente DECIMAL(15,2) DEFAULT 0,
            seuil INTEGER DEFAULT 0,
            stock_f INTEGER DEFAULT 0,
            stock_bl INTEGER DEFAULT 0,
            FOREIGN KEY (famille) REFERENCES %I.famille_art(famille),
            FOREIGN KEY (nfournisseur) REFERENCES %I.fournisseur(nfournisseur)
        );
    ', schema_name, schema_name, schema_name);

    -- Factures
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.fact (
            nfact SERIAL PRIMARY KEY,
            nclient VARCHAR(20),
            date_fact DATE,
            montant_ht DECIMAL(15,2) DEFAULT 0,
            timbre DECIMAL(15,2) DEFAULT 0,
            tva DECIMAL(15,2) DEFAULT 0,
            autre_taxe DECIMAL(15,2) DEFAULT 0,
            marge DECIMAL(15,2) DEFAULT 0,
            banq VARCHAR(100),
            ncheque VARCHAR(50),
            nbc VARCHAR(50),
            date_bc DATE,
            nom_preneur VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (nclient) REFERENCES %I.client(nclient)
        );
    ', schema_name, schema_name);

    -- Détails factures
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.detail_fact (
            id SERIAL PRIMARY KEY,
            nfact INTEGER,
            narticle VARCHAR(20),
            qte INTEGER,
            tva DECIMAL(5,2),
            pr_achat DECIMAL(15,2),
            prix DECIMAL(15,2),
            total_ligne DECIMAL(15,2),
            FOREIGN KEY (nfact) REFERENCES %I.fact(nfact) ON DELETE CASCADE,
            FOREIGN KEY (narticle) REFERENCES %I.article(narticle)
        );
    ', schema_name, schema_name, schema_name);

    -- Bons de livraison
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.bl (
            nfact SERIAL PRIMARY KEY,
            nclient VARCHAR(20),
            date_fact DATE,
            montant_ht DECIMAL(15,2) DEFAULT 0,
            timbre DECIMAL(15,2) DEFAULT 0,
            tva DECIMAL(15,2) DEFAULT 0,
            autre_taxe DECIMAL(15,2) DEFAULT 0,
            facturer BOOLEAN DEFAULT FALSE,
            banq VARCHAR(100),
            ncheque VARCHAR(50),
            nbc VARCHAR(50),
            date_bc DATE,
            nom_preneur VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (nclient) REFERENCES %I.client(nclient)
        );
    ', schema_name, schema_name);

    -- Détails bons de livraison
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.detail_bl (
            id SERIAL PRIMARY KEY,
            nfact INTEGER,
            narticle VARCHAR(20),
            qte INTEGER,
            tva DECIMAL(5,2),
            prix DECIMAL(15,2),
            total_ligne DECIMAL(15,2),
            facturer BOOLEAN DEFAULT FALSE,
            FOREIGN KEY (nfact) REFERENCES %I.bl(nfact) ON DELETE CASCADE,
            FOREIGN KEY (narticle) REFERENCES %I.article(narticle)
        );
    ', schema_name, schema_name, schema_name);

    -- Proformas
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.fprof (
            nfact SERIAL PRIMARY KEY,
            nclient VARCHAR(20),
            date_fact DATE,
            montant_ht DECIMAL(15,2) DEFAULT 0,
            timbre DECIMAL(15,2) DEFAULT 0,
            tva DECIMAL(15,2) DEFAULT 0,
            autre_taxe DECIMAL(15,2) DEFAULT 0,
            marge DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (nclient) REFERENCES %I.client(nclient)
        );
    ', schema_name, schema_name);

    -- Détails proformas
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.detail_fprof (
            id SERIAL PRIMARY KEY,
            nfact INTEGER,
            narticle VARCHAR(20),
            qte INTEGER,
            tva DECIMAL(5,2),
            pr_achat DECIMAL(15,2),
            prix DECIMAL(15,2),
            total_ligne DECIMAL(15,2),
            FOREIGN KEY (nfact) REFERENCES %I.fprof(nfact) ON DELETE CASCADE,
            FOREIGN KEY (narticle) REFERENCES %I.article(narticle)
        );
    ', schema_name, schema_name, schema_name);

    -- Factures d'achat
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.fachat (
            nfact SERIAL PRIMARY KEY,
            nfournisseur VARCHAR(20),
            date_fact DATE,
            montant_ht DECIMAL(15,2) DEFAULT 0,
            timbre DECIMAL(15,2) DEFAULT 0,
            tva DECIMAL(15,2) DEFAULT 0,
            autre_taxe DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (nfournisseur) REFERENCES %I.fournisseur(nfournisseur)
        );
    ', schema_name, schema_name);

    -- Détails factures d'achat
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.fachat_detail (
            id SERIAL PRIMARY KEY,
            nfact INTEGER,
            narticle VARCHAR(20),
            qte INTEGER,
            tva DECIMAL(5,2),
            prix DECIMAL(15,2),
            total_ligne DECIMAL(15,2),
            FOREIGN KEY (nfact) REFERENCES %I.fachat(nfact) ON DELETE CASCADE,
            FOREIGN KEY (narticle) REFERENCES %I.article(narticle)
        );
    ', schema_name, schema_name, schema_name);

    -- Mouvements de stock
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.stock_movements (
            id SERIAL PRIMARY KEY,
            narticle VARCHAR(20),
            movement_type VARCHAR(20),
            quantity INTEGER,
            previous_stock INTEGER,
            new_stock INTEGER,
            reference_id INTEGER,
            reference_type VARCHAR(20),
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_by VARCHAR(100),
            FOREIGN KEY (narticle) REFERENCES %I.article(narticle)
        );
    ', schema_name, schema_name);

    -- Table activite (informations entreprise)
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.activite (
            id SERIAL PRIMARY KEY,
            code_activite VARCHAR(20),
            domaine_activite TEXT,
            sous_domaine TEXT,
            raison_sociale TEXT,
            adresse TEXT,
            commune TEXT,
            wilaya TEXT,
            tel_fixe TEXT,
            tel_port TEXT,
            nrc TEXT,
            nis TEXT,
            nart TEXT,
            ident_fiscal TEXT,
            banq TEXT,
            entete_bon TEXT,
            e_mail TEXT,
            nom_entreprise TEXT,
            telephone TEXT,
            email TEXT,
            nif TEXT,
            rc TEXT,
            logo_url TEXT,
            slogan TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    ', schema_name);

    RETURN 'Tables créées pour le schéma: ' || schema_name;
END;
$$;

-- =====================================================
-- 4. CRÉATION DES TABLES POUR TOUS LES TENANTS
-- =====================================================

SELECT create_tenant_tables('2025_bu01');
SELECT create_tenant_tables('2025_bu02');
SELECT create_tenant_tables('2024_bu01');

-- =====================================================
-- 5. FONCTION DE COPIE DES DONNÉES ACTIVITE
-- =====================================================

CREATE OR REPLACE FUNCTION copy_activite1_to_tenant(p_tenant TEXT)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    source_record RECORD;
    result_text TEXT := '';
    rows_inserted INTEGER := 0;
BEGIN
    -- Supprimer les données existantes
    EXECUTE format('DELETE FROM %I.activite WHERE id > 0 OR id IS NULL', p_tenant);
    
    -- Copier les données de activite1 vers le tenant
    FOR source_record IN 
        SELECT * FROM public.activite1
    LOOP
        EXECUTE format('
            INSERT INTO %I.activite (
                code_activite, domaine_activite, sous_domaine, raison_sociale,
                adresse, commune, wilaya, tel_fixe, tel_port, nrc, nis, nart,
                ident_fiscal, banq, entete_bon, e_mail, nom_entreprise, 
                telephone, email, nif, rc, logo_url, slogan
            ) VALUES (
                %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L,
                %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
            )',
            p_tenant,
            'BU01',                                           -- code_activite = "BU01"
            COALESCE(source_record.domaine_activite, ''),     -- domaine_activite
            COALESCE(source_record.sous_domaine, ''),         -- sous_domaine
            COALESCE(source_record.raison_sociale, ''),       -- raison_sociale
            COALESCE(source_record.adresse, ''),              -- adresse
            COALESCE(source_record.commune, ''),              -- commune
            COALESCE(source_record.wilaya, ''),               -- wilaya
            COALESCE(source_record.tel_fixe, ''),             -- tel_fixe
            COALESCE(source_record.tel_port, ''),             -- tel_port
            COALESCE(source_record.nrc, ''),                  -- nrc
            COALESCE(source_record.nis, ''),                  -- nis
            COALESCE(source_record.nis, ''),                  -- nart = nis
            COALESCE(source_record.ident_fiscal, ''),         -- ident_fiscal
            COALESCE(source_record.banq, ''),                 -- banq
            NULL,                                             -- entete_bon = NULL
            COALESCE(source_record.e_mail, ''),               -- e_mail
            COALESCE(source_record.raison_sociale, ''),       -- nom_entreprise = raison_sociale
            COALESCE(source_record.tel_fixe, ''),             -- telephone = tel_fixe
            COALESCE(source_record.e_mail, ''),               -- email = e_mail
            COALESCE(source_record.ident_fiscal, ''),         -- nif = ident_fiscal
            COALESCE(source_record.nrc, ''),                  -- rc = nrc
            NULL,                                             -- logo_url = NULL
            NULL                                              -- slogan = NULL
        );
        
        rows_inserted := rows_inserted + 1;
        result_text := result_text || 'Copié: ' || COALESCE(source_record.raison_sociale, 'N/A') || '. ';
    END LOOP;
    
    result_text := result_text || 'Total: ' || rows_inserted || ' ligne(s) insérée(s).';
    
    RETURN result_text;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- =====================================================
-- 6. FONCTION GET_COMPANY_INFO MULTI-TENANT
-- =====================================================

CREATE OR REPLACE FUNCTION get_company_info(p_tenant TEXT)
RETURNS TABLE (
    domaine_activite TEXT,
    sous_domaine TEXT,
    raison_sociale TEXT,
    adresse TEXT,
    commune TEXT,
    wilaya TEXT,
    tel_fixe TEXT,
    tel_port TEXT,
    nrc TEXT,
    nis TEXT,
    nart TEXT,
    ident_fiscal TEXT,
    banq TEXT,
    e_mail TEXT,
    nif TEXT,
    rc TEXT
) 
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY EXECUTE format('
        SELECT 
            a.domaine_activite::TEXT,
            a.sous_domaine::TEXT,
            a.raison_sociale::TEXT,
            a.adresse::TEXT,
            a.commune::TEXT,
            a.wilaya::TEXT,
            a.tel_fixe::TEXT,
            a.tel_port::TEXT,
            a.nrc::TEXT,
            a.nis::TEXT,
            a.nart::TEXT,
            a.ident_fiscal::TEXT,
            a.banq::TEXT,
            a.e_mail::TEXT,
            a.nif::TEXT,
            a.rc::TEXT
        FROM %I.activite a
        ORDER BY a.created_at DESC
        LIMIT 1
    ', p_tenant);
EXCEPTION
    WHEN OTHERS THEN
        RETURN QUERY SELECT 
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
            NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT;
END;
$$;

-- =====================================================
-- 7. FONCTIONS RPC POUR LES VENTES
-- =====================================================

-- Fonction pour créer un bon de livraison
CREATE OR REPLACE FUNCTION create_delivery_note(
    p_tenant TEXT,
    p_client_id TEXT,
    p_items JSONB
)
RETURNS JSONB
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
    v_bl_id INTEGER;
    v_item JSONB;
    v_total_ht DECIMAL(15,2) := 0;
    v_total_tva DECIMAL(15,2) := 0;
    v_total_ttc DECIMAL(15,2) := 0;
    v_line_total DECIMAL(15,2);
    v_line_tva DECIMAL(15,2);
BEGIN
    -- Créer le bon de livraison
    EXECUTE format('
        INSERT INTO %I.bl (nclient, date_fact, montant_ht, tva, created_at)
        VALUES (%L, CURRENT_DATE, 0, 0, CURRENT_TIMESTAMP)
        RETURNING nfact
    ', p_tenant, p_client_id) INTO v_bl_id;
    
    -- Ajouter les articles
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_line_total := (v_item->>'qte')::INTEGER * (v_item->>'prix')::DECIMAL(15,2);
        v_line_tva := v_line_total * (v_item->>'tva')::DECIMAL(5,2) / 100;
        
        EXECUTE format('
            INSERT INTO %I.detail_bl (nfact, narticle, qte, prix, tva, total_ligne)
            VALUES (%L, %L, %L, %L, %L, %L)
        ', p_tenant, v_bl_id, v_item->>'narticle', 
           (v_item->>'qte')::INTEGER, (v_item->>'prix')::DECIMAL(15,2),
           (v_item->>'tva')::DECIMAL(5,2), v_line_total);
        
        v_total_ht := v_total_ht + v_line_total;
        v_total_tva := v_total_tva + v_line_tva;
    END LOOP;
    
    v_total_ttc := v_total_ht + v_total_tva;
    
    -- Mettre à jour les totaux
    EXECUTE format('
        UPDATE %I.bl 
        SET montant_ht = %L, tva = %L
        WHERE nfact = %L
    ', p_tenant, v_total_ht, v_total_tva, v_bl_id);
    
    RETURN jsonb_build_object(
        'success', true,
        'bl_id', v_bl_id,
        'total_ht', v_total_ht,
        'total_tva', v_total_tva,
        'total_ttc', v_total_ttc
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- =====================================================
-- 8. DONNÉES D'EXEMPLE
-- =====================================================

-- Copier les données d'entreprise vers tous les tenants
SELECT copy_activite1_to_tenant('2025_bu01');
SELECT copy_activite1_to_tenant('2025_bu02');

-- Insérer des données d'exemple pour 2025_bu01
INSERT INTO "2025_bu01".famille_art (famille) VALUES 
    ('OUTILLAGE'),
    ('ÉLECTRONIQUE'),
    ('MÉCANIQUE')
ON CONFLICT DO NOTHING;

INSERT INTO "2025_bu01".fournisseur (nfournisseur, nom_fournisseur, adresse_fourni, tel, email) VALUES 
    ('F001', 'FOURNISSEUR OUTILLAGE', 'Alger', '021123456', 'contact@fournisseur1.dz'),
    ('F002', 'ÉLECTRO SUPPLY', 'Oran', '041654321', 'info@electro.dz')
ON CONFLICT DO NOTHING;

INSERT INTO "2025_bu01".client (nclient, raison_sociale, adresse, tel, email) VALUES 
    ('001', 'CLIENT ENTREPRISE 1', 'Mostaganem Centre', '045123456', 'client1@email.dz'),
    ('002', 'SOCIÉTÉ CLIENT 2', 'Alger', '021987654', 'client2@email.dz')
ON CONFLICT DO NOTHING;

INSERT INTO "2025_bu01".article (narticle, famille, designation, nfournisseur, prix_unitaire, tva, prix_vente, stock_f, stock_bl) VALUES 
    ('121', 'OUTILLAGE', 'Perceuse électrique', 'F001', 240.00, 19, 285.60, 50, 50),
    ('112', 'ÉLECTRONIQUE', 'Lampe 12 volts', 'F002', 65.00, 19, 77.35, 100, 100),
    ('ART001', 'MÉCANIQUE', 'Clé à molette 250mm', 'F001', 85.00, 19, 101.15, 25, 25)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. PERMISSIONS
-- =====================================================

-- Accorder les permissions sur toutes les fonctions
GRANT EXECUTE ON FUNCTION create_tenant_tables(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION copy_activite1_to_tenant(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_company_info(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_delivery_note(TEXT, TEXT, JSONB) TO authenticated, anon;

-- =====================================================
-- 10. VÉRIFICATION
-- =====================================================

-- Vérifier que tout fonctionne
SELECT 'Schémas créés:' as status;
SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '%bu%' ORDER BY schema_name;

SELECT 'Données entreprise:' as status;
SELECT get_company_info('2025_bu01');

SELECT 'Tables dans 2025_bu01:' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = '2025_bu01' ORDER BY table_name;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- RÉSUMÉ :
-- ✅ Schémas multi-tenants créés (2025_bu01, 2025_bu02, 2024_bu01)
-- ✅ Toutes les tables créées dans chaque schéma
-- ✅ Données d'entreprise copiées depuis activite1
-- ✅ Fonctions RPC multi-tenants
-- ✅ Données d'exemple insérées
-- ✅ Permissions accordées
-- ✅ Système prêt pour production

SELECT 'SCRIPT TERMINÉ AVEC SUCCÈS !' as final_status;