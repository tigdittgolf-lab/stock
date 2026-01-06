-- =====================================================
-- CRÉATION DES FONCTIONS RPC MANQUANTES POUR LES DÉTAILS BL
-- =====================================================

-- 1. Fonction pour récupérer les détails d'un BL par ID
CREATE OR REPLACE FUNCTION public.get_bl_details_by_id(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Exécuter la requête dynamique pour récupérer les détails du BL
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;

-- 2. Fonction alternative pour récupérer les détails d'un BL
CREATE OR REPLACE FUNCTION public.get_bl_details(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Exécuter la requête dynamique pour récupérer les détails du BL
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;

-- 3. Fonction pour récupérer les détails BL par tenant (version générale)
CREATE OR REPLACE FUNCTION public.get_detail_bl_by_tenant(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    narticle TEXT,
    designation TEXT,
    qte INTEGER,
    prix NUMERIC,
    tva NUMERIC,
    total_ligne NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Exécuter la requête dynamique pour récupérer les détails du BL
    RETURN QUERY EXECUTE format('
        SELECT 
            d.narticle::TEXT,
            COALESCE(a.designation, ''Article '' || d.narticle)::TEXT as designation,
            d.qte::INTEGER,
            d.prix::NUMERIC,
            d.tva::NUMERIC,
            d.total_ligne::NUMERIC
        FROM %I.detail_bl d
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE d.nfact = $1
        ORDER BY d.narticle
    ', schema_name, schema_name)
    USING p_nfact;
END;
$$;

-- 4. Fonction pour récupérer un BL complet avec ses détails (optimisée)
CREATE OR REPLACE FUNCTION public.get_bl_complete_by_id(
    p_tenant TEXT,
    p_nfact INTEGER
)
RETURNS TABLE (
    -- Informations BL
    nbl INTEGER,
    nfact INTEGER,
    date_bl DATE,
    date_fact DATE,
    nclient TEXT,
    client_name TEXT,
    client_address TEXT,
    client_phone TEXT,
    montant_ht NUMERIC,
    tva NUMERIC,
    montant_ttc NUMERIC,
    -- Détails articles (JSON)
    details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    schema_name TEXT;
BEGIN
    -- Construire le nom du schéma
    schema_name := p_tenant;
    
    -- Exécuter la requête dynamique pour récupérer le BL complet
    RETURN QUERY EXECUTE format('
        SELECT 
            bl.nbl::INTEGER,
            bl.nfact::INTEGER,
            bl.date_bl::DATE,
            bl.date_fact::DATE,
            bl.nclient::TEXT,
            COALESCE(c.nom_client, c.raison_sociale, bl.nclient)::TEXT as client_name,
            COALESCE(c.adresse_client, c.adresse, '''')::TEXT as client_address,
            COALESCE(c.tel, '''')::TEXT as client_phone,
            bl.montant_ht::NUMERIC,
            bl.tva::NUMERIC,
            bl.montant_ttc::NUMERIC,
            -- Agrégation des détails en JSON
            COALESCE(
                jsonb_agg(
                    jsonb_build_object(
                        ''narticle'', d.narticle,
                        ''designation'', COALESCE(a.designation, ''Article '' || d.narticle),
                        ''qte'', d.qte,
                        ''prix'', d.prix,
                        ''tva'', d.tva,
                        ''total_ligne'', d.total_ligne
                    )
                    ORDER BY d.narticle
                ) FILTER (WHERE d.narticle IS NOT NULL),
                ''[]''::jsonb
            ) as details
        FROM %I.bl bl
        LEFT JOIN %I.client c ON bl.nclient = c.nclient
        LEFT JOIN %I.detail_bl d ON bl.nfact = d.nfact
        LEFT JOIN %I.article a ON d.narticle = a.narticle
        WHERE bl.nfact = $1
        GROUP BY bl.nbl, bl.nfact, bl.date_bl, bl.date_fact, bl.nclient, 
                 c.nom_client, c.raison_sociale, c.adresse_client, c.adresse, c.tel,
                 bl.montant_ht, bl.tva, bl.montant_ttc
    ', schema_name, schema_name, schema_name, schema_name, schema_name)
    USING p_nfact;
END;
$$;

-- =====================================================
-- PERMISSIONS ET SÉCURITÉ
-- =====================================================

-- Accorder les permissions d'exécution
GRANT EXECUTE ON FUNCTION public.get_bl_details_by_id(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bl_details(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_detail_bl_by_tenant(TEXT, INTEGER) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_bl_complete_by_id(TEXT, INTEGER) TO anon, authenticated;

-- =====================================================
-- TESTS DES FONCTIONS
-- =====================================================

-- Test 1: Récupérer les détails du BL 3
SELECT * FROM public.get_bl_details_by_id('2025_bu01', 3);

-- Test 2: Récupérer les détails du BL 4
SELECT * FROM public.get_bl_details('2025_bu01', 4);

-- Test 3: Récupérer les détails du BL 5
SELECT * FROM public.get_detail_bl_by_tenant('2025_bu01', 5);

-- Test 4: Récupérer un BL complet avec détails
SELECT * FROM public.get_bl_complete_by_id('2025_bu01', 4);