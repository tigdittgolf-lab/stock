-- Solution pour le problème de contrainte famille
-- Exécutez ce script dans Supabase SQL Editor

-- 1. Fonction pour insérer une famille si elle n'existe pas
CREATE OR REPLACE FUNCTION ensure_famille_exists(p_tenant TEXT, p_famille VARCHAR(50))
RETURNS VOID
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insérer la famille si elle n'existe pas déjà
    EXECUTE format('
        INSERT INTO %I.famille_art (famille) 
        SELECT %L 
        WHERE NOT EXISTS (
            SELECT 1 FROM %I.famille_art WHERE famille = %L
        )',
        p_tenant, p_famille, p_tenant, p_famille
    );
EXCEPTION
    WHEN OTHERS THEN
        -- Ignorer les erreurs (famille existe déjà ou table n'existe pas)
        NULL;
END;
$$;

-- 2. Fonction améliorée pour insérer un article avec gestion automatique des familles
CREATE OR REPLACE FUNCTION insert_article_to_tenant_safe(
    p_tenant TEXT,
    p_narticle VARCHAR(20),
    p_famille VARCHAR(50),
    p_designation VARCHAR(200),
    p_nfournisseur VARCHAR(20),
    p_prix_unitaire DECIMAL(15,2),
    p_marge DECIMAL(5,2),
    p_tva DECIMAL(5,2),
    p_prix_vente DECIMAL(15,2),
    p_seuil INTEGER,
    p_stock_f INTEGER,
    p_stock_bl INTEGER
)
RETURNS TEXT
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Créer la famille si elle n'existe pas (seulement si p_famille n'est pas NULL)
    IF p_famille IS NOT NULL THEN
        PERFORM ensure_famille_exists(p_tenant, p_famille);
    END IF;
    
    -- Insérer l'article
    EXECUTE format('
        INSERT INTO %I.article (
            narticle, famille, designation, nfournisseur,
            prix_unitaire, marge, tva, prix_vente,
            seuil, stock_f, stock_bl
        ) VALUES (
            %L, %L, %L, %L, %L, %L, %L, %L, %L, %L, %L
        )',
        p_tenant,
        p_narticle, p_famille, p_designation, p_nfournisseur,
        p_prix_unitaire, p_marge, p_tva, p_prix_vente,
        p_seuil, p_stock_f, p_stock_bl
    );
    
    RETURN 'Article inséré avec succès: ' || p_narticle;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 'ERREUR: ' || SQLERRM;
END;
$$;

-- 3. Créer les familles de base dans le schéma 2025_bu01
DO $$
BEGIN
    -- Créer les familles de base
    PERFORM ensure_famille_exists('2025_bu01', 'Electricité');
    PERFORM ensure_famille_exists('2025_bu01', 'Droguerie');
    PERFORM ensure_famille_exists('2025_bu01', 'Peinture');
    PERFORM ensure_famille_exists('2025_bu01', 'Outillage');
    PERFORM ensure_famille_exists('2025_bu01', 'Plomberie');
    PERFORM ensure_famille_exists('2025_bu01', 'Carrelage');
END;
$$;