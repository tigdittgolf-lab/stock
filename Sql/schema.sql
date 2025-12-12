-- PostgreSQL Schema for the new SaaS application

-- Table: activite
CREATE TABLE IF NOT EXISTS activite (
    code_activite VARCHAR(20) PRIMARY KEY, -- Assuming code_activite is unique and acts as PK
    domaine_activite VARCHAR(255),
    sous_domaine VARCHAR(255),
    raison_sociale VARCHAR(255),
    adresse VARCHAR(255),
    commune VARCHAR(255),
    wilaya VARCHAR(255),
    tel_fixe VARCHAR(20),
    tel_port VARCHAR(20),
    nrc VARCHAR(50),
    nis VARCHAR(50),
    nart VARCHAR(50),
    ident_fiscal VARCHAR(50),
    banq VARCHAR(255),
    entete_bon TEXT,
    e_mail VARCHAR(255)
);

-- Table: stock_table_parameter
CREATE TABLE IF NOT EXISTS stock_table_parameter (
    code_activite VARCHAR(20) PRIMARY KEY REFERENCES activite(code_activite),
    db_name VARCHAR(255),
    n_bl INTEGER DEFAULT 1,
    n_fact INTEGER DEFAULT 1,
    n_prof INTEGER DEFAULT 1,
    user_bd VARCHAR(255),
    passwd_bd VARCHAR(255),
    lieu_backup VARCHAR(255)
);

-- Table: famille_art
CREATE TABLE IF NOT EXISTS famille_art (
    famille VARCHAR(50) PRIMARY KEY
);

-- Table: fournisseur
CREATE TABLE IF NOT EXISTS fournisseur (
    Nfournisseur VARCHAR(10) PRIMARY KEY,
    Nom_fournisseur VARCHAR(50) NOT NULL,
    Resp_fournisseur VARCHAR(50),
    Adresse_fourni VARCHAR(100),
    Tel VARCHAR(20),
    tel1 VARCHAR(20),
    tel2 VARCHAR(20),
    CAF NUMERIC(15, 2) DEFAULT 0.00,
    CABL NUMERIC(15, 2) DEFAULT 0.00,
    EMAIL VARCHAR(50),
    commentaire TEXT
);

-- Table: article
CREATE TABLE IF NOT EXISTS article (
    Narticle VARCHAR(10) PRIMARY KEY,
    famille VARCHAR(50) NOT NULL REFERENCES famille_art(famille),
    designation VARCHAR(100) NOT NULL,
    Nfournisseur VARCHAR(10) NOT NULL REFERENCES fournisseur(Nfournisseur),
    prix_unitaire NUMERIC(15, 2) NOT NULL,
    marge INTEGER NOT NULL,
    tva NUMERIC(5, 2) NOT NULL,
    prix_vente NUMERIC(15, 2) NOT NULL,
    seuil INTEGER NOT NULL,
    stock_f INTEGER NOT NULL,
    stock_bl INTEGER NOT NULL
);

-- Table: client
CREATE TABLE IF NOT EXISTS client (
    Nclient VARCHAR(10) PRIMARY KEY,
    Raison_sociale VARCHAR(100),
    adresse VARCHAR(255),
    contact_person VARCHAR(50),
    C_affaire_fact NUMERIC(15, 2) DEFAULT 0.00,
    C_affaire_bl NUMERIC(15, 2) DEFAULT 0.00,
    NRC VARCHAR(50),
    Date_RC DATE,
    Lieu_RC VARCHAR(50),
    I_Fiscal VARCHAR(50),
    N_article VARCHAR(50),
    Tel VARCHAR(20),
    email VARCHAR(50),
    Commentaire TEXT
);

-- Table: fact (Master Sales Invoice)
CREATE TABLE IF NOT EXISTS fact (
    NFact SERIAL PRIMARY KEY, -- Use SERIAL for auto-incrementing integer PK
    Nclient VARCHAR(10) NOT NULL REFERENCES client(Nclient),
    date_fact DATE NOT NULL,
    montant_ht NUMERIC(15, 2) NOT NULL,
    timbre NUMERIC(15, 2) NOT NULL,
    TVA NUMERIC(15, 2) NOT NULL,
    autre_taxe NUMERIC(15, 2) NOT NULL,
    marge NUMERIC(15, 2) DEFAULT 0.00, -- Inferred from Facture.java
    banq VARCHAR(255), -- Inferred from Facture.java
    ncheque VARCHAR(255), -- Inferred from Facture.java
    nbc VARCHAR(255), -- Inferred from Facture.java (Bon de Commande)
    date_bc DATE, -- Inferred from Facture.java
    nom_preneur VARCHAR(255) -- Inferred from Facture.java
);

-- Table: detail_fact (Detail Sales Invoice)
CREATE TABLE IF NOT EXISTS detail_fact (
    id SERIAL PRIMARY KEY, -- Adding a unique ID for each detail line
    NFact INTEGER NOT NULL REFERENCES fact(NFact) ON DELETE CASCADE,
    Narticle VARCHAR(10) NOT NULL REFERENCES article(Narticle),
    Qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    pr_achat NUMERIC(15, 2) DEFAULT 0.00, -- Inferred from Facture.java
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL
);

-- Table: bl (Master Delivery Note)
CREATE TABLE IF NOT EXISTS bl (
    NFact SERIAL PRIMARY KEY, -- This seems to be the delivery note number, not necessarily a foreign key to fact
    Nclient VARCHAR(10) NOT NULL REFERENCES client(Nclient),
    date_fact DATE NOT NULL,
    montant_ht NUMERIC(15, 2) NOT NULL,
    timbre NUMERIC(15, 2) NOT NULL,
    TVA NUMERIC(15, 2) NOT NULL,
    autre_taxe NUMERIC(15, 2) NOT NULL,
    facturer BOOLEAN DEFAULT FALSE,
    nbc VARCHAR(255), -- Bon de Commande
    date_bc DATE,
    nom_preneur VARCHAR(255),
    banq VARCHAR(255), -- Inferred from Achat.java
    ncheque VARCHAR(255) -- Inferred from Achat.java
);

-- Table: detail_bl (Detail Delivery Note)
CREATE TABLE IF NOT EXISTS detail_bl (
    id SERIAL PRIMARY KEY, -- Adding a unique ID for each detail line
    NFact INTEGER NOT NULL REFERENCES bl(NFact) ON DELETE CASCADE,
    Narticle VARCHAR(10) NOT NULL REFERENCES article(Narticle),
    Qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL,
    facturer BOOLEAN DEFAULT FALSE
);

-- Table: user_info (for application users, will be replaced by Supabase Auth eventually)
CREATE TABLE IF NOT EXISTS user_info (
    username VARCHAR(50) PRIMARY KEY,
    pass_word VARCHAR(50) NOT NULL,
    profil VARCHAR(20) DEFAULT 'USER', -- Inferred from Articles.java
    has_login BOOLEAN DEFAULT FALSE, -- Inferred from Articles.java
    activite VARCHAR(255), -- Inferred from Login_St_stock.java
    code_activite VARCHAR(20) REFERENCES activite(code_activite) -- Inferred from Articles.java
);

-- Table: fprof (Master Proforma Invoice) - Inferred from Java code, similar structure to fact/bl
CREATE TABLE IF NOT EXISTS fprof (
    NFact SERIAL PRIMARY KEY,
    Nclient VARCHAR(10) NOT NULL REFERENCES client(Nclient),
    date_fact DATE NOT NULL,
    montant_ht NUMERIC(15, 2) NOT NULL,
    timbre NUMERIC(15, 2) NOT NULL,
    TVA NUMERIC(15, 2) NOT NULL,
    autre_taxe NUMERIC(15, 2) NOT NULL,
    marge NUMERIC(15, 2) DEFAULT 0.00,
    banq VARCHAR(255),
    ncheque VARCHAR(255),
    nbc VARCHAR(255),
    date_bc DATE,
    nom_preneur VARCHAR(255)
);

-- Table: detail_fprof (Detail Proforma Invoice) - Inferred from Java code
CREATE TABLE IF NOT EXISTS detail_fprof (
    id SERIAL PRIMARY KEY,
    NFact INTEGER NOT NULL REFERENCES fprof(NFact) ON DELETE CASCADE,
    Narticle VARCHAR(10) NOT NULL REFERENCES article(Narticle),
    Qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    pr_achat NUMERIC(15, 2) DEFAULT 0.00,
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL
);

-- Table: fachat (Master Purchase Invoice) - Inferred from Achat.java
CREATE TABLE IF NOT EXISTS fachat (
    NFact SERIAL PRIMARY KEY,
    Nfournisseur VARCHAR(10) NOT NULL REFERENCES fournisseur(Nfournisseur),
    date_fact DATE NOT NULL,
    montant_ht NUMERIC(15, 2) NOT NULL,
    timbre NUMERIC(15, 2) NOT NULL,
    TVA NUMERIC(15, 2) NOT NULL,
    autre_taxe NUMERIC(15, 2) NOT NULL,
    banq VARCHAR(255),
    ncheque VARCHAR(255)
);

-- Table: fachat_detail (Detail Purchase Invoice) - Inferred from Achat.java
CREATE TABLE IF NOT EXISTS fachat_detail (
    id SERIAL PRIMARY KEY,
    NFact INTEGER NOT NULL REFERENCES fachat(NFact) ON DELETE CASCADE,
    Narticle VARCHAR(10) NOT NULL REFERENCES article(Narticle),
    Qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL
);
