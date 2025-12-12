import { supabaseAdmin } from '../supabaseClient.js';

export class SchemaManager {
  
  /**
   * Create a new tenant schema with all required tables
   */
  static async createTenantSchema(businessUnit: string, year: number): Promise<void> {
    const schemaName = `${year}_${businessUnit}`;
    
    try {
      console.log(`Creating schema: ${schemaName}`);
      
      // Create schema
      await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE SCHEMA IF NOT EXISTS "${schemaName}";`
      });

      // Create all tables in the new schema
      await this.createTablesInSchema(schemaName);
      
      console.log(`✅ Schema ${schemaName} created successfully`);
    } catch (error) {
      console.error(`Error creating schema ${schemaName}:`, error);
      throw error;
    }
  }

  /**
   * Create all required tables in a specific schema
   */
  static async createTablesInSchema(schemaName: string): Promise<void> {
    const tables = [
      this.getFamilleArtTableSQL(schemaName),
      this.getFournisseurTableSQL(schemaName),
      this.getClientTableSQL(schemaName),
      this.getArticleTableSQL(schemaName),
      this.getFactTableSQL(schemaName),
      this.getDetailFactTableSQL(schemaName),
      this.getBlTableSQL(schemaName),
      this.getDetailBlTableSQL(schemaName),
      this.getFprofTableSQL(schemaName),
      this.getDetailFprofTableSQL(schemaName),
      this.getFachatTableSQL(schemaName),
      this.getFachatDetailTableSQL(schemaName),
      this.getStockMovementsTableSQL(schemaName)
    ];

    for (const tableSQL of tables) {
      try {
        await supabaseAdmin.rpc('exec_sql', { sql: tableSQL });
      } catch (error) {
        console.warn(`Warning creating table in ${schemaName}:`, error);
        // Continue with other tables
      }
    }
  }

  /**
   * Check if a schema exists by trying to query a table in it
   */
  static async schemaExists(schemaName: string): Promise<boolean> {
    try {
      // Try to query the famille_art table in the schema
      // If the schema doesn't exist, this will fail
      const { error } = await supabaseAdmin
        .from(`${schemaName}.famille_art`)
        .select('famille')
        .limit(1);
      
      // If there's no error or the error is about no rows, schema exists
      // If error is about relation not existing, schema doesn't exist
      if (!error) {
        console.log(`Schema ${schemaName} exists (query successful)`);
        return true;
      }
      
      if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
        console.log(`Schema ${schemaName} does not exist (${error.message})`);
        return false;
      }
      
      // Other errors might mean schema exists but table is empty or other issues
      console.log(`Schema ${schemaName} likely exists (error: ${error.message})`);
      return true;
      
    } catch (error) {
      console.log(`Schema ${schemaName} check failed:`, error);
      return false;
    }
  }

  /**
   * Create new exercise by copying data from current year
   */
  static async createNewExercise(businessUnit: string, currentYear: number, newYear: number): Promise<void> {
    const currentSchema = `${currentYear}_${businessUnit}`;
    const newSchema = `${newYear}_${businessUnit}`;
    
    try {
      console.log(`Creating new exercise: ${newSchema} from ${currentSchema}`);
      
      // 1. Create new schema (use IF NOT EXISTS to avoid errors)
      await supabaseAdmin.rpc('exec_sql', {
        sql: `CREATE SCHEMA IF NOT EXISTS "${newSchema}";`
      });

      // 2. Create all tables in the new schema
      await this.createTablesInSchema(newSchema);
      
      // 3. Copy reference data (families, suppliers, clients, articles with stock)
      await this.copyReferenceData(currentSchema, newSchema);
      
      console.log(`✅ New exercise ${newSchema} created successfully`);
    } catch (error) {
      console.error(`Error creating new exercise ${newSchema}:`, error);
      throw error;
    }
  }

  /**
   * Copy reference data from current year to new year
   */
  static async copyReferenceData(currentSchema: string, newSchema: string): Promise<void> {
    try {
      console.log(`Copying reference data from ${currentSchema} to ${newSchema}`);

      // First check if source schema has data
      try {
        const { error: testError } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT 1 FROM "${currentSchema}".famille_art LIMIT 1;`
        });
        
        if (testError) {
          throw new Error(`Source schema ${currentSchema} does not exist or has no data`);
        }
      } catch (e) {
        if (e.message.includes('does not exist')) {
          throw new Error(`Current exercise schema ${currentSchema} does not exist`);
        }
        throw e;
      }

      // Copy famille_art
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO "${newSchema}".famille_art (famille)
          SELECT famille FROM "${currentSchema}".famille_art;
        `
      });
      console.log('✅ Families copied');

      // Copy fournisseur
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO "${newSchema}".fournisseur (
            nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni,
            tel, tel1, tel2, caf, cabl, email, commentaire
          )
          SELECT 
            nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni,
            tel, tel1, tel2, caf, cabl, email, commentaire
          FROM "${currentSchema}".fournisseur;
        `
      });
      console.log('✅ Suppliers copied');

      // Copy client
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO "${newSchema}".client (
            nclient, raison_sociale, adresse, contact_person,
            c_affaire_fact, c_affaire_bl, nrc, date_rc, lieu_rc,
            i_fiscal, n_article, tel, email, commentaire
          )
          SELECT 
            nclient, raison_sociale, adresse, contact_person,
            c_affaire_fact, c_affaire_bl, nrc, date_rc, lieu_rc,
            i_fiscal, n_article, tel, email, commentaire
          FROM "${currentSchema}".client;
        `
      });
      console.log('✅ Clients copied');

      // Copy article (with current stock as opening stock)
      await supabaseAdmin.rpc('exec_sql', {
        sql: `
          INSERT INTO "${newSchema}".article (
            narticle, famille, designation, nfournisseur,
            prix_unitaire, marge, tva, prix_vente,
            seuil, stock_f, stock_bl
          )
          SELECT 
            narticle, famille, designation, nfournisseur,
            prix_unitaire, marge, tva, prix_vente,
            seuil, stock_f, stock_bl
          FROM "${currentSchema}".article;
        `
      });
      console.log('✅ Articles copied with current stock');

      console.log(`✅ All reference data copied from ${currentSchema} to ${newSchema}`);
      
    } catch (error) {
      console.error(`Error copying reference data:`, error);
      throw error;
    }
  }

  /**
   * List all tenant schemas
   */
  static async listTenantSchemas(): Promise<string[]> {
    try {
      const { data, error } = await supabaseAdmin.rpc('exec_sql', {
        sql: `
          SELECT schema_name 
          FROM information_schema.schemata 
          WHERE schema_name ~ '^[0-9]{4}_bu[0-9]{2}$'
          ORDER BY schema_name;
        `
      });
      
      if (error) throw error;
      
      return data?.map((row: any) => row.schema_name) || [];
    } catch (error) {
      console.error('Error listing tenant schemas:', error);
      return [];
    }
  }

  // Table creation SQL methods
  private static getFamilleArtTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".famille_art (
        famille VARCHAR(50) PRIMARY KEY
      );
    `;
  }

  private static getFournisseurTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".fournisseur (
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
    `;
  }

  private static getClientTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".client (
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
    `;
  }

  private static getArticleTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".article (
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
        FOREIGN KEY (famille) REFERENCES "${schema}".famille_art(famille),
        FOREIGN KEY (nfournisseur) REFERENCES "${schema}".fournisseur(nfournisseur)
      );
    `;
  }

  private static getFactTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".fact (
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
        FOREIGN KEY (nclient) REFERENCES "${schema}".client(nclient)
      );
    `;
  }

  private static getDetailFactTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".detail_fact (
        id SERIAL PRIMARY KEY,
        nfact INTEGER,
        narticle VARCHAR(20),
        qte INTEGER,
        tva DECIMAL(5,2),
        pr_achat DECIMAL(15,2),
        prix DECIMAL(15,2),
        total_ligne DECIMAL(15,2),
        FOREIGN KEY (nfact) REFERENCES "${schema}".fact(nfact) ON DELETE CASCADE,
        FOREIGN KEY (narticle) REFERENCES "${schema}".article(narticle)
      );
    `;
  }

  private static getBlTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".bl (
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
        FOREIGN KEY (nclient) REFERENCES "${schema}".client(nclient)
      );
    `;
  }

  private static getDetailBlTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".detail_bl (
        id SERIAL PRIMARY KEY,
        nfact INTEGER,
        narticle VARCHAR(20),
        qte INTEGER,
        tva DECIMAL(5,2),
        prix DECIMAL(15,2),
        total_ligne DECIMAL(15,2),
        facturer BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (nfact) REFERENCES "${schema}".bl(nfact) ON DELETE CASCADE,
        FOREIGN KEY (narticle) REFERENCES "${schema}".article(narticle)
      );
    `;
  }

  private static getFprofTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".fprof (
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
        FOREIGN KEY (nclient) REFERENCES "${schema}".client(nclient)
      );
    `;
  }

  private static getDetailFprofTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".detail_fprof (
        id SERIAL PRIMARY KEY,
        nfact INTEGER,
        narticle VARCHAR(20),
        qte INTEGER,
        tva DECIMAL(5,2),
        pr_achat DECIMAL(15,2),
        prix DECIMAL(15,2),
        total_ligne DECIMAL(15,2),
        FOREIGN KEY (nfact) REFERENCES "${schema}".fprof(nfact) ON DELETE CASCADE,
        FOREIGN KEY (narticle) REFERENCES "${schema}".article(narticle)
      );
    `;
  }

  private static getFachatTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".fachat (
        nfact SERIAL PRIMARY KEY,
        nfournisseur VARCHAR(20),
        date_fact DATE,
        montant_ht DECIMAL(15,2) DEFAULT 0,
        timbre DECIMAL(15,2) DEFAULT 0,
        tva DECIMAL(15,2) DEFAULT 0,
        autre_taxe DECIMAL(15,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nfournisseur) REFERENCES "${schema}".fournisseur(nfournisseur)
      );
    `;
  }

  private static getFachatDetailTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".fachat_detail (
        id SERIAL PRIMARY KEY,
        nfact INTEGER,
        narticle VARCHAR(20),
        qte INTEGER,
        tva DECIMAL(5,2),
        prix DECIMAL(15,2),
        total_ligne DECIMAL(15,2),
        FOREIGN KEY (nfact) REFERENCES "${schema}".fachat(nfact) ON DELETE CASCADE,
        FOREIGN KEY (narticle) REFERENCES "${schema}".article(narticle)
      );
    `;
  }

  private static getStockMovementsTableSQL(schema: string): string {
    return `
      CREATE TABLE IF NOT EXISTS "${schema}".stock_movements (
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
        FOREIGN KEY (narticle) REFERENCES "${schema}".article(narticle)
      );
    `;
  }
}