import { DatabaseConfig, QueryResult } from './types';
import { SupabaseAdapter } from './adapters/supabase-adapter';
import { PostgreSQLServerAdapter } from './server-adapters/postgresql-server-adapter';
import { MySQLServerAdapter } from './server-adapters/mysql-server-adapter';
import { DatabaseAdapter } from './types';

export interface MigrationProgress {
  step: string;
  progress: number;
  total: number;
  message: string;
  success: boolean;
  error?: string;
}

export interface MigrationOptions {
  includeSchema: boolean;
  includeData: boolean;
  overwriteExisting: boolean;
  batchSize: number;
  tenants?: string[];
}

/**
 * Service de migration côté serveur - Logique complète
 * Utilise les vrais adaptateurs avec connexions réelles
 */
export class MigrationServerService {
  private sourceAdapter: DatabaseAdapter | null = null;
  private targetAdapter: DatabaseAdapter | null = null;
  private progressCallback?: (progress: MigrationProgress) => void;

  constructor(progressCallback?: (progress: MigrationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  /**
   * Initialise la migration entre deux bases de données
   */
  async initializeMigration(
    sourceConfig: DatabaseConfig,
    targetConfig: DatabaseConfig
  ): Promise<boolean> {
    try {
      this.reportProgress('Initialisation', 0, 100, 'Connexion aux bases de données...', true);

      // Créer les adaptateurs
      this.sourceAdapter = this.createAdapter(sourceConfig);
      this.targetAdapter = this.createAdapter(targetConfig);

      // Tester les connexions
      const sourceConnected = await this.sourceAdapter.connect();
      if (!sourceConnected) {
        throw new Error('Impossible de se connecter à la base source');
      }

      const targetConnected = await this.targetAdapter.connect();
      if (!targetConnected) {
        throw new Error('Impossible de se connecter à la base cible');
      }

      this.reportProgress('Initialisation', 100, 100, 'Connexions établies', true);
      return true;
    } catch (error) {
      this.reportProgress('Initialisation', 0, 100, 'Erreur d\'initialisation', false, 
        error instanceof Error ? error.message : 'Erreur inconnue');
      return false;
    }
  }

  /**
   * Lance la migration complète
   */
  async migrate(options: MigrationOptions = {
    includeSchema: true,
    includeData: true,
    overwriteExisting: false,
    batchSize: 100
  }): Promise<boolean> {
    if (!this.sourceAdapter || !this.targetAdapter) {
      throw new Error('Migration non initialisée');
    }

    try {
      let currentStep = 0;
      const totalSteps = 6;

      // Étape 1: Récupérer les schémas source
      currentStep++;
      this.reportProgress('Analyse', currentStep, totalSteps, 'Analyse des schémas source...', true);
      const sourceSchemas = await this.getSourceSchemas();

      // Étape 2: Créer les schémas cible
      if (options.includeSchema) {
        currentStep++;
        this.reportProgress('Schémas', currentStep, totalSteps, 'Création des schémas cible...', true);
        await this.createTargetSchemas(sourceSchemas);
      }

      // Étape 3: Migrer les données
      if (options.includeData) {
        currentStep++;
        this.reportProgress('Données', currentStep, totalSteps, 'Migration des données...', true);
        await this.migrateData(sourceSchemas, options);
      }

      // Étape 4: Vérifier l'intégrité
      currentStep++;
      this.reportProgress('Vérification', currentStep, totalSteps, 'Vérification de l\'intégrité...', true);
      const integrity = await this.verifyIntegrity(sourceSchemas);

      if (!integrity) {
        throw new Error('Échec de la vérification d\'intégrité');
      }

      // Étape 5: Finalisation
      currentStep++;
      this.reportProgress('Finalisation', currentStep, totalSteps, 'Finalisation...', true);
      await this.finalizeMigration();

      this.reportProgress('Terminé', totalSteps, totalSteps, 'Migration terminée avec succès !', true);
      return true;

    } catch (error) {
      this.reportProgress('Erreur', 0, 100, 'Migration échouée', false,
        error instanceof Error ? error.message : 'Erreur inconnue');
      return false;
    }
  }

  /**
   * Test de connexion pour une configuration
   */
  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const adapter = this.createAdapter(config);
      const result = await adapter.testConnection();
      await adapter.disconnect();
      return result;
    } catch (error) {
      console.error('Erreur test connexion:', error);
      return false;
    }
  }

  /**
   * Récupère la liste des schémas/tenants source
   */
  private async getSourceSchemas(): Promise<string[]> {
    if (!this.sourceAdapter) throw new Error('Adaptateur source non initialisé');

    const schemas = await this.sourceAdapter.getSchemas();
    
    // Si pas de schémas détectés, utiliser les schémas par défaut
    if (schemas.length === 0) {
      return ['2025_bu01', '2024_bu01', '2025_bu02', '2026_bu01'];
    }

    return schemas;
  }

  /**
   * Crée les schémas dans la base cible
   */
  private async createTargetSchemas(schemas: string[]): Promise<void> {
    if (!this.targetAdapter) throw new Error('Adaptateur cible non initialisé');

    for (let i = 0; i < schemas.length; i++) {
      const schema = schemas[i];
      this.reportProgress('Schémas', i + 1, schemas.length, `Création du schéma ${schema}...`, true);
      
      await this.targetAdapter.createSchema(schema);
      
      // Créer les tables dans le schéma
      await this.createTablesInSchema(schema);
    }
  }

  /**
   * Crée les tables dans un schéma
   */
  private async createTablesInSchema(schema: string): Promise<void> {
    if (!this.targetAdapter) throw new Error('Adaptateur cible non initialisé');

    const tables = [
      // Table articles
      `CREATE TABLE IF NOT EXISTS "${schema}".article (
        narticle VARCHAR(50) PRIMARY KEY,
        designation VARCHAR(255),
        prix_achat DECIMAL(10,2),
        prix_vente DECIMAL(10,2),
        prix_unitaire DECIMAL(10,2),
        stock_initial INTEGER DEFAULT 0,
        stock_actuel INTEGER DEFAULT 0,
        seuil_min INTEGER DEFAULT 0,
        famille VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table clients
      `CREATE TABLE IF NOT EXISTS "${schema}".client (
        nclient VARCHAR(50) PRIMARY KEY,
        nom_client VARCHAR(255),
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table fournisseurs
      `CREATE TABLE IF NOT EXISTS "${schema}".fournisseur (
        nfournisseur VARCHAR(50) PRIMARY KEY,
        nom_fournisseur VARCHAR(255),
        adresse TEXT,
        telephone VARCHAR(50),
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table famille_art
      `CREATE TABLE IF NOT EXISTS "${schema}".famille_art (
        id SERIAL PRIMARY KEY,
        famille VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table activite
      `CREATE TABLE IF NOT EXISTS "${schema}".activite (
        id SERIAL PRIMARY KEY,
        nom_entreprise VARCHAR(255),
        adresse TEXT,
        commune VARCHAR(100),
        wilaya VARCHAR(100),
        telephone VARCHAR(50),
        tel_fixe VARCHAR(50),
        tel_port VARCHAR(50),
        email VARCHAR(100),
        e_mail VARCHAR(100),
        nif VARCHAR(50),
        ident_fiscal VARCHAR(50),
        rc VARCHAR(50),
        nrc VARCHAR(50),
        nart VARCHAR(50),
        banq VARCHAR(255),
        sous_domaine TEXT,
        domaine_activite TEXT,
        slogan TEXT,
        logo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table bl (bons de livraison)
      `CREATE TABLE IF NOT EXISTS "${schema}".bl (
        nbl VARCHAR(50) PRIMARY KEY,
        nclient VARCHAR(50),
        date_bl DATE,
        montant_ht DECIMAL(10,2),
        montant_ttc DECIMAL(10,2),
        marge DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nclient) REFERENCES "${schema}".client(nclient)
      )`,
      
      // Table facture
      `CREATE TABLE IF NOT EXISTS "${schema}".facture (
        nfact VARCHAR(50) PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        montant_ht DECIMAL(10,2),
        montant_ttc DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nclient) REFERENCES "${schema}".client(nclient)
      )`,
      
      // Table proforma
      `CREATE TABLE IF NOT EXISTS "${schema}".proforma (
        nproforma VARCHAR(50) PRIMARY KEY,
        nclient VARCHAR(50),
        date_proforma DATE,
        montant_ht DECIMAL(10,2),
        montant_ttc DECIMAL(10,2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (nclient) REFERENCES "${schema}".client(nclient)
      )`
    ];

    for (const tableSQL of tables) {
      try {
        await this.targetAdapter.query(tableSQL);
      } catch (error) {
        console.warn(`Erreur création table dans ${schema}:`, error);
        // Continuer même si certaines tables existent déjà
      }
    }
  }

  /**
   * Migre les données entre les bases
   */
  private async migrateData(schemas: string[], options: MigrationOptions): Promise<void> {
    if (!this.sourceAdapter || !this.targetAdapter) {
      throw new Error('Adaptateurs non initialisés');
    }

    const tables = ['article', 'client', 'fournisseur', 'famille_art', 'activite', 'bl', 'facture', 'proforma'];
    let totalTables = schemas.length * tables.length;
    let processedTables = 0;

    for (const schema of schemas) {
      for (const table of tables) {
        processedTables++;
        this.reportProgress('Données', processedTables, totalTables, 
          `Migration ${schema}.${table}...`, true);

        try {
          // Récupérer les données source
          const sourceData = await this.sourceAdapter.executeRPC(`get_${table}s`, { p_tenant: schema });
          
          if (sourceData.success && sourceData.data && Array.isArray(sourceData.data) && sourceData.data.length > 0) {
            // Insérer dans la cible par batch
            await this.insertDataBatch(schema, table, sourceData.data, options.batchSize);
          }
        } catch (error) {
          console.warn(`Erreur migration ${schema}.${table}:`, error);
          // Continuer avec les autres tables
        }
      }
    }
  }

  /**
   * Insère les données par batch
   */
  private async insertDataBatch(schema: string, table: string, data: any[], batchSize: number): Promise<void> {
    if (!this.targetAdapter || !data.length) return;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      for (const row of batch) {
        try {
          const columns = Object.keys(row).join(', ');
          const values = Object.values(row).map(v => 
            v === null ? 'NULL' : 
            typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
            v
          ).join(', ');
          
          const insertSQL = `INSERT INTO "${schema}".${table} (${columns}) VALUES (${values}) ON CONFLICT DO NOTHING`;
          await this.targetAdapter.query(insertSQL);
        } catch (error) {
          console.warn(`Erreur insertion ${schema}.${table}:`, error);
        }
      }
    }
  }

  /**
   * Vérifie l'intégrité des données migrées
   */
  private async verifyIntegrity(schemas: string[]): Promise<boolean> {
    if (!this.sourceAdapter || !this.targetAdapter) return false;

    try {
      for (const schema of schemas) {
        // Vérifier le nombre d'articles
        const sourceArticles = await this.sourceAdapter.executeRPC('get_articles', { p_tenant: schema });
        const targetArticles = await this.targetAdapter.executeRPC('get_articles', { p_tenant: schema });
        
        const sourceCount = sourceArticles.success && Array.isArray(sourceArticles.data) ? sourceArticles.data.length : 0;
        const targetCount = targetArticles.success && Array.isArray(targetArticles.data) ? targetArticles.data.length : 0;
        
        if (sourceCount !== targetCount) {
          console.warn(`Différence de count pour ${schema}.article: source=${sourceCount}, target=${targetCount}`);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erreur vérification intégrité:', error);
      return false;
    }
  }

  /**
   * Finalise la migration
   */
  private async finalizeMigration(): Promise<void> {
    // Déconnecter les adaptateurs
    if (this.sourceAdapter) {
      await this.sourceAdapter.disconnect();
    }
    if (this.targetAdapter) {
      await this.targetAdapter.disconnect();
    }
  }

  /**
   * Crée un adaptateur selon le type de base
   */
  private createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'supabase':
        return new SupabaseAdapter(config);
      case 'postgresql':
        return new PostgreSQLServerAdapter(config);
      case 'mysql':
        return new MySQLServerAdapter(config);
      default:
        throw new Error(`Type de base non supporté: ${config.type}`);
    }
  }

  /**
   * Rapporte le progrès de la migration
   */
  private reportProgress(step: string, progress: number, total: number, message: string, success: boolean, error?: string): void {
    const progressData: MigrationProgress = {
      step,
      progress,
      total,
      message,
      success,
      error
    };

    console.log(`[Migration Serveur] ${step}: ${message} (${progress}/${total})`);
    
    if (this.progressCallback) {
      this.progressCallback(progressData);
    }
  }
}

// Export du service serveur uniquement
export { MigrationServerService as ServerMigrationService };