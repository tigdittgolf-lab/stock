-- Supabase SQL Setup for Multi-tenant Stock Management Application
-- This application manages multiple business units with annual databases
-- Run this in your Supabase SQL Editor

-- Enable Row Level Security
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core business tables (shared across all tenants)
CREATE TABLE IF NOT EXISTS activite (
  code_activite VARCHAR(20) PRIMARY KEY,
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
  e_mail VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stock_table_parameter (
  code_activite VARCHAR(20) PRIMARY KEY REFERENCES activite(code_activite),
  db_name VARCHAR(255), -- Current year for this business unit
  n_bl INTEGER DEFAULT 1,
  n_fact INTEGER DEFAULT 1,
  n_prof INTEGER DEFAULT 1,
  user_bd VARCHAR(255),
  passwd_bd VARCHAR(255),
  lieu_backup VARCHAR(255),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master data tables (tenant-scoped, shared across years)
CREATE TABLE IF NOT EXISTS famille_art (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  famille VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, famille)
);

CREATE TABLE IF NOT EXISTS fournisseur (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  Nfournisseur VARCHAR(10) NOT NULL,
  Nom_fournisseur VARCHAR(50) NOT NULL,
  Resp_fournisseur VARCHAR(50),
  Adresse_fourni VARCHAR(100),
  Tel VARCHAR(20),
  tel1 VARCHAR(20),
  tel2 VARCHAR(20),
  CAF NUMERIC(15, 2) DEFAULT 0.00,
  CABL NUMERIC(15, 2) DEFAULT 0.00,
  EMAIL VARCHAR(50),
  commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, Nfournisseur)
);

CREATE TABLE IF NOT EXISTS client (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  Nclient VARCHAR(10) NOT NULL,
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
  Commentaire TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, Nclient)
);

-- Transactional tables (tenant-scoped and year-scoped)
CREATE TABLE IF NOT EXISTS article (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL, -- Exercise year (e.g., 2024)
  Narticle VARCHAR(10) NOT NULL,
  famille VARCHAR(50) NOT NULL,
  designation VARCHAR(100) NOT NULL,
  Nfournisseur VARCHAR(10) NOT NULL,
  prix_unitaire NUMERIC(15, 2) NOT NULL,
  marge INTEGER NOT NULL,
  tva NUMERIC(5, 2) NOT NULL,
  prix_vente NUMERIC(15, 2) NOT NULL,
  seuil INTEGER NOT NULL,
  stock_f INTEGER NOT NULL,
  stock_bl INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, year, Narticle)
  -- Note: Foreign key constraints handled in application logic for tenant isolation
);

-- Function to create client table
CREATE OR REPLACE FUNCTION create_client_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Invoice and transaction tables (tenant-scoped and year-scoped)
CREATE TABLE IF NOT EXISTS fact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL,
  NFact INTEGER NOT NULL,
  Nclient VARCHAR(10) NOT NULL,
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
  nom_preneur VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, year, NFact)
  -- Note: Foreign key constraints handled in application logic for tenant isolation
);

CREATE TABLE IF NOT EXISTS detail_fact (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL,
  NFact INTEGER NOT NULL,
  Narticle VARCHAR(10) NOT NULL,
  Qte INTEGER NOT NULL,
  tva NUMERIC(5, 2),
  pr_achat NUMERIC(15, 2) DEFAULT 0.00,
  prix NUMERIC(15, 2) NOT NULL,
  total_ligne NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Note: Foreign key constraints handled in application logic for tenant isolation
);

CREATE TABLE IF NOT EXISTS bl (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL,
  NFact INTEGER NOT NULL,
  Nclient VARCHAR(10) NOT NULL,
  date_fact DATE NOT NULL,
  montant_ht NUMERIC(15, 2) NOT NULL,
  timbre NUMERIC(15, 2) NOT NULL,
  TVA NUMERIC(15, 2) NOT NULL,
  autre_taxe NUMERIC(15, 2) NOT NULL,
  facturer BOOLEAN DEFAULT FALSE,
  banq VARCHAR(255),
  ncheque VARCHAR(255),
  nbc VARCHAR(255),
  date_bc DATE,
  nom_preneur VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, year, NFact)
  -- Note: Foreign key constraints handled in application logic for tenant isolation
);

CREATE TABLE IF NOT EXISTS detail_bl (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL,
  NFact INTEGER NOT NULL,
  Narticle VARCHAR(10) NOT NULL,
  Qte INTEGER NOT NULL,
  tva NUMERIC(5, 2),
  prix NUMERIC(15, 2) NOT NULL,
  total_ligne NUMERIC(15, 2) NOT NULL,
  facturer BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Note: Foreign key constraints handled in application logic for tenant isolation
);

CREATE TABLE IF NOT EXISTS fprof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL,
  NFact INTEGER NOT NULL,
  Nclient VARCHAR(10) NOT NULL,
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
  nom_preneur VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, year, NFact)
  -- Note: Foreign key constraints handled in application logic for tenant isolation
);

CREATE TABLE IF NOT EXISTS detail_fprof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL,
  NFact INTEGER NOT NULL,
  Narticle VARCHAR(10) NOT NULL,
  Qte INTEGER NOT NULL,
  tva NUMERIC(5, 2),
  pr_achat NUMERIC(15, 2) DEFAULT 0.00,
  prix NUMERIC(15, 2) NOT NULL,
  total_ligne NUMERIC(15, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Note: Foreign key constraints handled in application logic for tenant isolation
);

-- Function to create detail_fact table
CREATE OR REPLACE FUNCTION create_detail_fact_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS detail_fact (
    id SERIAL PRIMARY KEY,
    NFact INTEGER NOT NULL REFERENCES fact(NFact) ON DELETE CASCADE,
    Narticle VARCHAR(10) NOT NULL REFERENCES article(Narticle),
    Qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    pr_achat NUMERIC(15, 2) DEFAULT 0.00,
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create bl table
CREATE OR REPLACE FUNCTION create_bl_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS bl (
    NFact SERIAL PRIMARY KEY,
    Nclient VARCHAR(10) NOT NULL REFERENCES client(Nclient),
    date_fact DATE NOT NULL,
    montant_ht NUMERIC(15, 2) NOT NULL,
    timbre NUMERIC(15, 2) NOT NULL,
    TVA NUMERIC(15, 2) NOT NULL,
    autre_taxe NUMERIC(15, 2) NOT NULL,
    facturer BOOLEAN DEFAULT FALSE,
    nbc VARCHAR(255),
    date_bc DATE,
    nom_preneur VARCHAR(255),
    banq VARCHAR(255),
    ncheque VARCHAR(255)
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create detail_bl table
CREATE OR REPLACE FUNCTION create_detail_bl_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS detail_bl (
    id SERIAL PRIMARY KEY,
    NFact INTEGER NOT NULL REFERENCES bl(NFact) ON DELETE CASCADE,
    Narticle VARCHAR(10) NOT NULL REFERENCES article(Narticle),
    Qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL,
    facturer BOOLEAN DEFAULT FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create fprof table
CREATE OR REPLACE FUNCTION create_fprof_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Function to create detail_fprof table
CREATE OR REPLACE FUNCTION create_detail_fprof_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Function to create fachat table
CREATE OR REPLACE FUNCTION create_fachat_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Function to create fachat_detail table
CREATE OR REPLACE FUNCTION create_fachat_detail_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS fachat_detail (
    id SERIAL PRIMARY KEY,
    NFact INTEGER NOT NULL REFERENCES fachat(NFact) ON DELETE CASCADE,
    Narticle VARCHAR(10) NOT NULL REFERENCES article(Narticle),
    Qte INTEGER NOT NULL,
    tva NUMERIC(5, 2),
    prix NUMERIC(15, 2) NOT NULL,
    total_ligne NUMERIC(15, 2) NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- User authentication and business unit access
CREATE TABLE IF NOT EXISTS user_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(50) NOT NULL,
  pass_word VARCHAR(50) NOT NULL,
  profil VARCHAR(20) DEFAULT 'USER',
  has_login BOOLEAN DEFAULT FALSE,
  activite VARCHAR(255), -- Business unit name
  code_activite VARCHAR(20) REFERENCES activite(code_activite),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(username)
);

-- Create stock movement tracking table
CREATE TABLE IF NOT EXISTS stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id VARCHAR(20) NOT NULL REFERENCES activite(code_activite),
  year INTEGER NOT NULL,
  narticle VARCHAR(10) NOT NULL,
  movement_type VARCHAR(20) NOT NULL, -- 'sale', 'purchase', 'adjustment'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reference_type VARCHAR(20), -- 'fact', 'bl', 'fachat', 'bachat'
  reference_id INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_article_tenant_year ON article(tenant_id, year);
CREATE INDEX IF NOT EXISTS idx_fact_tenant_year ON fact(tenant_id, year);
CREATE INDEX IF NOT EXISTS idx_detail_fact_tenant_year ON detail_fact(tenant_id, year);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant_year ON stock_movements(tenant_id, year);
CREATE INDEX IF NOT EXISTS idx_stock_movements_article ON stock_movements(narticle);
CREATE INDEX IF NOT EXISTS idx_user_activite ON user_info(code_activite);

-- Function to update stock on sale
CREATE OR REPLACE FUNCTION update_stock_on_sale(p_narticle VARCHAR(10), p_quantity INTEGER)
RETURNS void AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock_f INTO current_stock
  FROM article
  WHERE Narticle = p_narticle
  ORDER BY year DESC
  LIMIT 1;

  IF current_stock IS NULL THEN
    RAISE EXCEPTION 'Article % not found', p_narticle;
  END IF;

  -- Check if enough stock
  IF current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock for article %. Current: %, Requested: %', p_narticle, current_stock, p_quantity;
  END IF;

  -- Update stock
  UPDATE article
  SET stock_f = stock_f - p_quantity,
      updated_at = NOW()
  WHERE Narticle = p_narticle;

  -- Record movement
  INSERT INTO stock_movements (
    tenant_id, year, narticle, movement_type, quantity,
    previous_stock, new_stock, reference_type, notes
  )
  SELECT
    a.tenant_id, a.year, a.Narticle, 'sale', p_quantity,
    current_stock, current_stock - p_quantity, 'sale', 'Sale transaction'
  FROM article a
  WHERE a.Narticle = p_narticle
  ORDER BY a.year DESC
  LIMIT 1;

END;
$$ LANGUAGE plpgsql;

-- Function to update stock on purchase
CREATE OR REPLACE FUNCTION update_stock_on_purchase(p_narticle VARCHAR(10), p_quantity INTEGER)
RETURNS void AS $$
DECLARE
  current_stock INTEGER;
BEGIN
  -- Get current stock
  SELECT stock_f INTO current_stock
  FROM article
  WHERE Narticle = p_narticle
  ORDER BY year DESC
  LIMIT 1;

  IF current_stock IS NULL THEN
    -- Article doesn't exist, this shouldn't happen in normal flow
    RAISE EXCEPTION 'Article % not found', p_narticle;
  END IF;

  -- Update stock
  UPDATE article
  SET stock_f = stock_f + p_quantity,
      updated_at = NOW()
  WHERE Narticle = p_narticle;

  -- Record movement
  INSERT INTO stock_movements (
    tenant_id, year, narticle, movement_type, quantity,
    previous_stock, new_stock, reference_type, notes
  )
  SELECT
    a.tenant_id, a.year, a.Narticle, 'purchase', p_quantity,
    current_stock, current_stock + p_quantity, 'purchase', 'Purchase transaction'
  FROM article a
  WHERE a.Narticle = p_narticle
  ORDER BY a.year DESC
  LIMIT 1;

END;
$$ LANGUAGE plpgsql;

-- Function to create activite table
CREATE OR REPLACE FUNCTION create_activite_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS activite (
    code_activite VARCHAR(20) PRIMARY KEY,
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
END;
$$ LANGUAGE plpgsql;

-- Function to create stock_table_parameter table
CREATE OR REPLACE FUNCTION create_stock_table_parameter_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Tables are now created directly above, no need for function calls

-- Insert initial business unit and configuration
INSERT INTO activite (code_activite, domaine_activite, raison_sociale, adresse, commune, wilaya) VALUES
('BU01', 'Commerce de détail', 'Stock Management Company', '123 Main Street', 'Alger Centre', 'Alger')
ON CONFLICT (code_activite) DO NOTHING;

INSERT INTO stock_table_parameter (code_activite, db_name, n_bl, n_fact, n_prof) VALUES
('BU01', '2024', 1, 1, 1)
ON CONFLICT (code_activite) DO NOTHING;

-- Insert master data for business unit BU01
INSERT INTO famille_art (tenant_id, famille) VALUES
('BU01', 'Electricité'),
('BU01', 'Electro menager'),
('BU01', 'Droguerie'),
('BU01', 'Outillage'),
('BU01', 'Habillement'),
('BU01', 'Peinture'),
('BU01', 'Quincaillerie'),
('BU01', 'Plomberie'),
('BU01', 'Menage'),
('BU01', 'Electronique')
ON CONFLICT (tenant_id, famille) DO NOTHING;

INSERT INTO fournisseur (tenant_id, Nfournisseur, Nom_fournisseur, Resp_fournisseur, Adresse_fourni, Tel, tel1, tel2, CAF, CABL, EMAIL, commentaire) VALUES
('BU01', '120434', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 509040, 40981025, 'Sana_fr2001@yahoo.fr', ''),
('BU01', '1234', 'Habib', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 5090400, 40981000, 'habib_fr2001@yahoo.fr', 'Je lui doit une somme de 14 000 000'),
('BU01', '12434', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 509040, 40981025, 'Sana_fr2001@yahoo.fr', ''),
('BU01', '124340', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 509040, 40981025, 'Sana_fr2001@yahoo.fr', 'CAF et CABL non editable'),
('BU01', '1434', 'Sana', 'Belkacemi', 'Ain Benian', '21311407', '0770901660', '06602776607', 5090.43, 409810.25, 'Sana_fr2001@yahoo.fr', ''),
('BU01', '1212', 'Fournisseur Droguerie', 'Dupont', 'Alger Centre', '021234567', '', '', 100000, 80000, 'contact@fournisseur-droguerie.dz', 'Fournisseur de produits droguerie'),
('BU01', '12', 'Fournisseur Electro', 'Martin', 'Alger', '021234568', '', '', 200000, 150000, 'contact@fournisseur-electro.dz', 'Fournisseur d''électroménager'),
('BU01', '11', 'Fournisseur Electricité', 'Dubois', 'Alger', '021234569', '', '', 150000, 120000, 'contact@fournisseur-electricite.dz', 'Fournisseur de matériel électrique'),
('BU01', '111', 'Fournisseur Peinture', 'Garcia', 'Alger', '021234570', '', '', 80000, 60000, 'contact@fournisseur-peinture.dz', 'Fournisseur de peinture et matériel'),
('BU01', 'AZD', 'Fournisseur AZD', 'AZD Corp', 'Alger', '021234571', '', '', 50000, 40000, 'contact@azd.dz', 'Fournisseur général'),
('BU01', 'azd', 'Fournisseur azd', 'azd Corp', 'Alger', '021234575', '', '', 45000, 35000, 'contact@azd2.dz', 'Fournisseur général (minuscules)'),
('BU01', 'qsd', 'Fournisseur QSD', 'QSD Ltd', 'Alger', '021234572', '', '', 75000, 55000, 'contact@qsd.dz', 'Fournisseur de quincaillerie'),
('BU01', 'Dsd', 'Fournisseur DSD', 'DSD Inc', 'Alger', '021234573', '', '', 60000, 45000, 'contact@dsd.dz', 'Fournisseur outillage'),
('BU01', '121', 'Fournisseur Habillement', 'Leroy', 'Alger', '021234574', '', '', 90000, 70000, 'contact@fournisseur-habillement.dz', 'Fournisseur d''habillement'),
('BU01', '999', 'Fournisseur Divers', 'Divers SA', 'Alger', '021234576', '', '', 30000, 25000, 'contact@divers.dz', 'Fournisseur divers')
ON CONFLICT (tenant_id, Nfournisseur) DO NOTHING;

INSERT INTO client (tenant_id, Nclient, Raison_sociale, adresse, contact_person, C_affaire_fact, C_affaire_bl, NRC, Date_RC, Lieu_RC, I_Fiscal, N_article, Tel, email, Commentaire) VALUES
('BU01', '10', 'Sana', 'mosta', 'SANA', 0, 0, '109238', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'SANA@JJ.COM', 'mosta'),
('BU01', '11', 'Habib', 'mosta', 'SANA', 0, 0, '101010', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'SANA@JJ.COM', 'mosta'),
('BU01', '12', 'Habib', 'mosta', 'habib', 0, 0, '109238', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'HABIB@JJ.COM', 'mosta'),
('BU01', '15', 'Aymen', 'mosta', 'OUMEYA', 0, 0, '109238', '2013-10-26', 'MOSTA', '1231123', '123123', '045212112', 'KAM@JJ.COM', 'mosta'),
('BU01', '20', 'KAM', 'mosta', 'OUMEYA', 0, 0, '109238', '2013-10-11', 'MOSTA', '1231123', '123123', '045212112', 'KAM@JJ.COM', 'mosta')
ON CONFLICT (tenant_id, Nclient) DO NOTHING;

INSERT INTO article (tenant_id, year, Narticle, famille, designation, Nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl) VALUES
('BU01', 2024, '01', 'Electricité', 'lampe', '1234', 12, 20, 12, 14.4, 12, 12, -98),
('BU01', 2024, '011', 'Habillement', 'COMPRESSEUR', '12434', 1233450, 10, 12, 1356795, 1, 2, -1),
('BU01', 2024, '10', 'Outillage', 'TV GRAND ECRAN1', '1434', 100, 10, 100, 110, 10, 12, 6),
('BU01', 2024, '100', 'Menage', 'TV GRAND ECRAN100', '1234', 10, 10, 100, 100, 10, 100, 100),
('BU01', 2024, '1000', 'Menage', 'TV GRAND ECRAN1000', '1234', 10000.23, 15, 100, 150003.45, 10, 100, 90),
('BU01', 2024, '1001', 'Droguerie', 'dorguerie', '1212', 5000.22, 12, 12, 5600.25, 12, 12, 12),
('BU01', 2024, '1010', 'Electro menager', '1211', '12', 123.12, 23, 12, 2831.76, 12, 12, 12),
('BU01', 2024, '11', 'Electricité', '11', '11', 1101, 11, 11, 12111, 11, 11, 0),
('BU01', 2024, '111', 'Droguerie', '122', '12', 12, 12, 12, 144, 12, 12, 12),
('BU01', 2024, '1111', 'Peinture', '111', '111', 1111, 11, 11, 12221, 11, 11, 11),
('BU01', 2024, '11221', 'Droguerie', '11', '111', 11, 11, 11, 121, 11, 11, 11),
('BU01', 2024, '1133', 'Electro menager', '111', '111', 11, 11, 11, 121, 11, 11, 11),
('BU01', 2024, '12', 'Electricité', 'azdkamz', 'azd', 1234, 12, 12, 14808, 12, 8, 8),
('BU01', 2024, '120', 'Outillage', '122', '1234', 120, 12, 10, 134.4, 10, 12, 13),
('BU01', 2024, '121', 'Habillement', '121', '121', 1000, 21, 12, 21000, 12, 12, 12),
('BU01', 2024, '12113', 'Peinture', 'AZQSDC', 'AZD', 121141, 12, 12, 1453692, 123, 123, 123),
('BU01', 2024, '1212', 'Peinture', 'QDQ', 'qsd', 1234, 10, 12, 12340, 12, 12, 12),
('BU01', 2024, '1231', 'Outillage', 'qsc,q;cmql', 'Dsd', 123123.12, 12, 10, 123124.23, 10, 12, 13),
('BU01', 2024, '14', 'Plomberie', 'cinture de sécurité', '1234', 12345.21, 12, 10, 148142.52, 10, 8, 13),
('BU01', 2024, '20', 'Peinture', 'TV PETIT ECRAN', '999', 100000, 5, 10, 105000, 0, 8, 4),
('BU01', 2024, '2222', 'Outillage', 'cinture de sécurité', '1234', 2222.23, 12, 10, 48889.06, 10, 12, 13),
('BU01', 2024, '231', 'Habillement', 'cinture de sécurité', '1234', 1231.12, 12, 10, 1233.34, 10, 12, 13),
('BU01', 2024, '30', 'Peinture', 'LAC 500', '120434', 120, 10, 10, 134.4, 10, 10, 8),
('BU01', 2024, '34', 'Peinture', 'LAC 500', '1234', 100, 10, 10, 124, 10, 10, 10),
('BU01', 2024, '401', 'Peinture', 'Vetement de securité', '1234', 100, 12, 10, 24.23, 10, 12, 8)
ON CONFLICT (tenant_id, year, Narticle) DO NOTHING;

INSERT INTO user_info (username, pass_word, profil, has_login, activite, code_activite) VALUES
('habib', 'habibo', 'ADMIN', FALSE, 'Stock Management Company', 'BU01'),
('sana', 'sanouna', 'USER', FALSE, 'Stock Management Company', 'BU01'),
('kam', 'kam', 'USER', FALSE, 'Stock Management Company', 'BU01'),
('aymen', 'habibo', 'USER', FALSE, 'Stock Management Company', 'BU01'),
('douaa', 'amina', 'USER', FALSE, 'Stock Management Company', 'BU01')
ON CONFLICT (username) DO NOTHING;
