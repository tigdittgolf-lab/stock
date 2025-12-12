import { supabaseAdmin } from './supabaseClient.js';

export async function setupDatabase() {
  console.log('Setting up database schema...');

  try {
    // Create tables in order
    await createFamilleArtTable();
    await createFournisseurTable();
    await createArticleTable();
    await createClientTable();
    await createFactTable();
    await createDetailFactTable();
    await createBlTable();
    await createDetailBlTable();
    await createFprofTable();
    await createDetailFprofTable();
    await createFachatTable();
    await createFachatDetailTable();
    await createUserInfoTable();
    await createActiviteTable();
    await createStockTableParameterTable();

    console.log('Database schema setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
    throw error;
  }
}

async function createFamilleArtTable() {
  const { error } = await supabaseAdmin
    .from('famille_art')
    .select('famille')
    .limit(1);
  if (error && error.code === 'PGRST116') {
    // Table doesn't exist, create it
    const createError = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS famille_art (
          famille VARCHAR(50) PRIMARY KEY
        );
      `
    });
    if (createError) throw createError;
  } else if (error) {
    throw error;
  }
}

async function createFournisseurTable() {
  const { error } = await supabaseAdmin.rpc('create_fournisseur_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createArticleTable() {
  const { error } = await supabaseAdmin.rpc('create_article_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createClientTable() {
  const { error } = await supabaseAdmin.rpc('create_client_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createFactTable() {
  const { error } = await supabaseAdmin.rpc('create_fact_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createDetailFactTable() {
  const { error } = await supabaseAdmin.rpc('create_detail_fact_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createBlTable() {
  const { error } = await supabaseAdmin.rpc('create_bl_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createDetailBlTable() {
  const { error } = await supabaseAdmin.rpc('create_detail_bl_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createFprofTable() {
  const { error } = await supabaseAdmin.rpc('create_fprof_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createDetailFprofTable() {
  const { error } = await supabaseAdmin.rpc('create_detail_fprof_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createFachatTable() {
  const { error } = await supabaseAdmin.rpc('create_fachat_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createFachatDetailTable() {
  const { error } = await supabaseAdmin.rpc('create_fachat_detail_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createUserInfoTable() {
  const { error } = await supabaseAdmin.rpc('create_user_info_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

async function createActiviteTable() {
  const { error } = await supabaseAdmin.rpc('create_activite_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
  
  // Insert default tenant if it doesn't exist using raw SQL
  try {
    await supabaseAdmin.rpc('exec_sql', {
      sql: `INSERT INTO activite (tenant_id) VALUES ('default') ON CONFLICT (tenant_id) DO NOTHING;`
    });
    console.log('✅ Default tenant ensured');
  } catch (e: any) {
    if (!e.message?.includes('already exists') && !e.message?.includes('duplicate')) {
      console.warn('Could not insert default tenant:', e.message);
    }
  }

  // Update activite table structure to include company info
  try {
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS nom_entreprise VARCHAR(200);
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS adresse TEXT;
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS telephone VARCHAR(50);
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS email VARCHAR(100);
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS nif VARCHAR(50);
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS rc VARCHAR(50);
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS logo_url TEXT;
        ALTER TABLE activite ADD COLUMN IF NOT EXISTS slogan TEXT;
      `
    });
    console.log('✅ Activite table structure updated');
  } catch (e: any) {
    console.warn('Could not update activite table:', e.message);
  }

  // Create RPC function for schema management
  try {
    await supabaseAdmin.rpc('exec_sql', {
      sql: `
        CREATE OR REPLACE FUNCTION ensure_tenant_schema(schema_name TEXT, business_unit TEXT, year INTEGER)
        RETURNS BOOLEAN AS $$
        BEGIN
          -- Create schema if it doesn't exist
          EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
          
          -- Insert tenant record if it doesn't exist
          INSERT INTO activite (tenant_id) VALUES (business_unit) ON CONFLICT (tenant_id) DO NOTHING;
          
          RETURN TRUE;
        EXCEPTION WHEN OTHERS THEN
          RAISE NOTICE 'Error creating schema %: %', schema_name, SQLERRM;
          RETURN FALSE;
        END;
        $$ LANGUAGE plpgsql;
      `
    });
    console.log('✅ Schema management function created');
  } catch (e: any) {
    console.warn('Could not create schema management function:', e.message);
  }
}

async function createStockTableParameterTable() {
  const { error } = await supabaseAdmin.rpc('create_stock_table_parameter_table');
  if (error && !error.message.includes('already exists')) {
    throw error;
  }
}

// SQL functions to create tables (these would be created in Supabase SQL editor)
export const sqlFunctions = `
-- Function to create famille_art table
CREATE OR REPLACE FUNCTION create_famille_art_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS famille_art (
    famille VARCHAR(50) PRIMARY KEY
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create fournisseur table
CREATE OR REPLACE FUNCTION create_fournisseur_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

-- Function to create article table
CREATE OR REPLACE FUNCTION create_article_table()
RETURNS void AS $$
BEGIN
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
END;
$$ LANGUAGE plpgsql;

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

-- Function to create fact table
CREATE OR REPLACE FUNCTION create_fact_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS fact (
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

-- Function to create user_info table
CREATE OR REPLACE FUNCTION create_user_info_table()
RETURNS void AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS user_info (
    username VARCHAR(50) PRIMARY KEY,
    pass_word VARCHAR(50) NOT NULL,
    profil VARCHAR(20) DEFAULT 'USER',
    has_login BOOLEAN DEFAULT FALSE,
    activite VARCHAR(255),
    code_activite VARCHAR(20) REFERENCES activite(code_activite)
  );
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
`;