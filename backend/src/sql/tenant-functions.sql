-- Fonction pour vérifier si un schéma existe
CREATE OR REPLACE FUNCTION check_schema_exists(schema_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = $1
    );
END;
$$;

-- Fonction pour créer un schéma tenant avec toutes les tables
CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Créer le schéma
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
    
    -- Créer la table famille_art
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.famille_art (
            famille VARCHAR(50) PRIMARY KEY
        )', schema_name);
    
    -- Créer la table fournisseur
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
        )', schema_name);
    
    -- Créer la table article
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
        )', schema_name, schema_name, schema_name);
    
    -- Créer la table client
    EXECUTE format('
        CREATE TABLE IF NOT EXISTS %I.client (
            nclient VARCHAR(20) PRIMARY KEY,
            raison_sociale VARCHAR(200),
            adresse TEXT,
            