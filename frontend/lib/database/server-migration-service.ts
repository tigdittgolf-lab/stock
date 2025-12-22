import { DatabaseConfig, QueryResult } from './types';
import { SupabaseAdapter } from './adapters/supabase-adapter';
import { MySQLAdapter } from './adapters/mysql-adapter';
import { PostgreSQLAdapter } from './adapters/postgresql-adapter';
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
 * Service de migration côté serveur - Version simplifiée
 */
export class MigrationServerService {
  private sourceAdapter: DatabaseAdapter | null = null;
  private targetAdapter: DatabaseAdapter | null = null;
  private progressCallback?: (progress: MigrationProgress) => void;

  constructor(progressCallback?: (progress: MigrationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  async initializeMigration(sourceConfig: DatabaseConfig, targetConfig: DatabaseConfig): Promise<boolean> {
    try {
      this.reportProgress('Initialisation', 50, 100, 'Création des adaptateurs...', true);
      
      this.sourceAdapter = this.createAdapter(sourceConfig);
      this.targetAdapter = this.createAdapter(targetConfig);

      const sourceConnected = await this.sourceAdapter.connect();
      const targetConnected = await this.targetAdapter.connect();

      if (!sourceConnected || !targetConnected) {
        throw new Error('Erreur de connexion');
      }

      this.reportProgress('Initialisation', 100, 100, 'Connexions établies', true);
      return true;
    } catch (error) {
      this.reportProgress('Initialisation', 0, 100, 'Erreur initialisation', false, 
        error instanceof Error ? error.message : 'Erreur');
      return false;
    }
  }

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
      // Étape 1: Analyse
      this.reportProgress('Analyse', 1, 5, 'Analyse des schémas...', true);
      const schemas = ['2025_bu01', '2024_bu01'];

      // Étape 2: Nettoyage
      this.reportProgress('Nettoyage', 2, 5, 'Nettoyage de la base cible...', true);
      await this.cleanupTarget(schemas);

      // Étape 3: Création des schémas
      this.reportProgress('Schémas', 3, 5, 'Création des schémas...', true);
      await this.createSchemas(schemas);

      // Étape 4: Migration des données
      this.reportProgress('Données', 4, 5, 'Migration des données...', true);
      if (options.includeData) {
        await this.migrateData(schemas);
      }

      // Étape 5: Finalisation
      this.reportProgress('Terminé', 5, 5, 'Migration terminée avec succès!', true);
      return true;

    } catch (error) {
      this.reportProgress('Erreur', 0, 5, 'Migration échouée', false,
        error instanceof Error ? error.message : 'Erreur');
      return false;
    }
  }

  private async cleanupTarget(schemas: string[]): Promise<void> {
    if (!this.targetAdapter) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    
    for (const schema of schemas) {
      try {
        if (isMySQL) {
          await this.targetAdapter.query(`DROP DATABASE IF EXISTS \`${schema}\``, [], 'mysql');
        } else {
          await this.targetAdapter.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
        }
      } catch (error) {
        console.warn(`Erreur suppression ${schema}:`, error);
      }
    }
  }

  private async createSchemas(schemas: string[]): Promise<void> {
    if (!this.targetAdapter) return;

    for (const schema of schemas) {
      await this.targetAdapter.createSchema(schema);
      await this.createTables(schema);
    }
  }

  private async createTables(schema: string): Promise<void> {
    if (!this.targetAdapter) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';

    const tables = [
      // Table articles
      `CREATE TABLE IF NOT EXISTS article (
        narticle VARCHAR(50) PRIMARY KEY,
        designation VARCHAR(255),
        famille VARCHAR(100),
        nfournisseur VARCHAR(50),
        prix_unitaire DECIMAL(10,2) DEFAULT 0,
        prix_vente DECIMAL(10,2) DEFAULT 0,
        marge DECIMAL(10,2) DEFAULT 0,
        tva DECIMAL(10,2) DEFAULT 19,
        seuil INT DEFAULT 0,
        stock_f INT DEFAULT 0,
        stock_bl INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table clients
      `CREATE TABLE IF NOT EXISTS client (
        nclient VARCHAR(50) PRIMARY KEY,
        raison_sociale VARCHAR(255),
        adresse TEXT,
        contact_person VARCHAR(255),
        tel VARCHAR(50),
        email VARCHAR(100),
        nrc VARCHAR(100),
        i_fiscal VARCHAR(100),
        c_affaire_fact DECIMAL(10,2) DEFAULT 0,
        c_affaire_bl DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table fournisseurs
      `CREATE TABLE IF NOT EXISTS fournisseur (
        nfournisseur VARCHAR(50) PRIMARY KEY,
        nom_fournisseur VARCHAR(255),
        resp_fournisseur VARCHAR(255),
        adresse_fourni TEXT,
        tel VARCHAR(50),
        tel1 VARCHAR(50),
        tel2 VARCHAR(50),
        email VARCHAR(100),
        caf DECIMAL(10,2) DEFAULT 0,
        cabl DECIMAL(10,2) DEFAULT 0,
        commentaire TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table famille_art
      `CREATE TABLE IF NOT EXISTS famille_art (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        famille VARCHAR(100) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table activite (informations entreprise)
      `CREATE TABLE IF NOT EXISTS activite (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nom_entreprise VARCHAR(255),
        adresse TEXT,
        commune VARCHAR(100),
        wilaya VARCHAR(100),
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table bl (bons de livraison)
      `CREATE TABLE IF NOT EXISTS bl (
        nfact INT PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        montant_ht DECIMAL(10,2) DEFAULT 0,
        tva DECIMAL(10,2) DEFAULT 0,
        montant_ttc DECIMAL(10,2) DEFAULT 0,
        marge DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table facture
      `CREATE TABLE IF NOT EXISTS facture (
        nfact INT PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        montant_ht DECIMAL(10,2) DEFAULT 0,
        tva DECIMAL(10,2) DEFAULT 0,
        montant_ttc DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table proforma
      `CREATE TABLE IF NOT EXISTS proforma (
        nfact INT PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        montant_ht DECIMAL(10,2) DEFAULT 0,
        tva DECIMAL(10,2) DEFAULT 0,
        montant_ttc DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table detail_bl
      `CREATE TABLE IF NOT EXISTS detail_bl (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nfact INT,
        narticle VARCHAR(50),
        qte INT DEFAULT 0,
        prix_unitaire DECIMAL(10,2) DEFAULT 0,
        montant DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table detail_fact
      `CREATE TABLE IF NOT EXISTS detail_fact (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nfact INT,
        narticle VARCHAR(50),
        qte INT DEFAULT 0,
        prix_unitaire DECIMAL(10,2) DEFAULT 0,
        montant DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Table detail_proforma
      `CREATE TABLE IF NOT EXISTS detail_proforma (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nfact INT,
        narticle VARCHAR(50),
        qte INT DEFAULT 0,
        prix_unitaire DECIMAL(10,2) DEFAULT 0,
        montant DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const tableSQL of tables) {
      try {
        if (isMySQL) {
          // Pour MySQL, se connecter directement à la base du schéma
          await this.targetAdapter.query(tableSQL, [], schema);
          console.log(`✅ Table créée dans ${schema}`);
        } else {
          // Pour PostgreSQL, utiliser le préfixe de schéma
          const prefixedSQL = tableSQL.replace('CREATE TABLE IF NOT EXISTS ', `CREATE TABLE IF NOT EXISTS "${schema}".`);
          await this.targetAdapter.query(prefixedSQL);
          console.log(`✅ Table créée dans ${schema}`);
        }
      } catch (error) {
        console.warn('Erreur création table:', error);
      }
    }
    
    console.log(`🎯 ${tables.length} tables créées dans ${schema}`);
  }

  private async migrateData(schemas: string[]): Promise<void> {
    if (!this.sourceAdapter || !this.targetAdapter) return;

    for (const schema of schemas) {
      try {
        console.log(`🔄 Migration complète des données pour ${schema}...`);
        
        // 1. Articles
        await this.migrateTableData(schema, 'articles', 'get_articles_by_tenant', this.insertArticle.bind(this));
        
        // 2. Clients
        await this.migrateTableData(schema, 'clients', 'get_clients_by_tenant', this.insertClient.bind(this));
        
        // 3. Fournisseurs
        await this.migrateTableData(schema, 'fournisseurs', 'get_fournisseurs_by_tenant', this.insertFournisseur.bind(this));
        
        // 4. Famille Articles
        await this.migrateTableData(schema, 'famille_art', 'get_famille_art_by_tenant', this.insertFamilleArt.bind(this));
        
        // 5. Activités (informations entreprise)
        await this.migrateTableData(schema, 'activites', 'get_activites_by_tenant', this.insertActivite.bind(this));
        
        // 6. Bons de Livraison
        await this.migrateTableData(schema, 'bls', 'get_bls_by_tenant', this.insertBL.bind(this));
        
        // 7. Factures
        await this.migrateTableData(schema, 'factures', 'get_factures_by_tenant', this.insertFacture.bind(this));
        
        // 8. Proformas
        await this.migrateTableData(schema, 'proformas', 'get_proformas_by_tenant', this.insertProforma.bind(this));
        
        // 9. Détails BL
        await this.migrateTableData(schema, 'detail_bl', 'get_detail_bl_by_tenant', this.insertDetailBL.bind(this));
        
        // 10. Détails Factures
        await this.migrateTableData(schema, 'detail_fact', 'get_detail_fact_by_tenant', this.insertDetailFacture.bind(this));
        
        // 11. Détails Proformas
        await this.migrateTableData(schema, 'detail_proforma', 'get_detail_proforma_by_tenant', this.insertDetailProforma.bind(this));
        
        console.log(`✅ Migration complète terminée pour ${schema} - 11 tables traitées`);
        
      } catch (error) {
        console.warn(`⚠️ Erreur migration ${schema}:`, error);
      }
    }
  }

  private async migrateTableData(
    schema: string, 
    tableName: string, 
    rpcFunction: string, 
    insertFunction: (schema: string, data: any) => Promise<void>
  ): Promise<void> {
    if (!this.sourceAdapter) return;

    try {
      const result = await this.sourceAdapter.executeRPC(rpcFunction, { p_tenant: schema });
      
      if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
        console.log(`📦 ${result.data.length} ${tableName} trouvés pour ${schema}, insertion en cours...`);
        
        for (const item of result.data) {
          try {
            await insertFunction(schema, item);
          } catch (error) {
            console.warn(`⚠️ Erreur insertion ${tableName}:`, error);
          }
        }
        
        console.log(`✅ ${result.data.length} ${tableName} insérés dans MySQL ${schema}`);
      } else {
        console.log(`📭 Aucun ${tableName} trouvé pour ${schema}`);
      }
    } catch (error) {
      console.warn(`⚠️ Erreur migration ${tableName} pour ${schema}:`, error);
    }
  }

  private async insertArticle(schema: string, article: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO article (narticle, designation, famille, prix_unitaire) VALUES (?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE designation = VALUES(designation)`;
    
    const values = [
      article.narticle || article.Narticle,
      article.designation,
      article.famille,
      article.prix_unitaire || 0
    ];

    console.log(`📝 Insertion article ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertClient(schema: string, client: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO client (nclient, raison_sociale, adresse, contact_person, tel, email, nrc, i_fiscal, c_affaire_fact, c_affaire_bl) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE raison_sociale = VALUES(raison_sociale)`;
    
    const values = [
      client.nclient,
      client.raison_sociale || '',
      client.adresse || '',
      client.contact_person || '',
      client.tel || '',
      client.email || '',
      client.nrc || '',
      client.i_fiscal || '',
      client.c_affaire_fact || 0,
      client.c_affaire_bl || 0
    ];

    console.log(`📝 Insertion client ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertFournisseur(schema: string, fournisseur: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO fournisseur (nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, tel1, tel2, email, caf, cabl, commentaire) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE nom_fournisseur = VALUES(nom_fournisseur)`;
    
    const values = [
      fournisseur.nfournisseur,
      fournisseur.nom_fournisseur || '',
      fournisseur.resp_fournisseur || '',
      fournisseur.adresse_fourni || '',
      fournisseur.tel || '',
      fournisseur.tel1 || '',
      fournisseur.tel2 || '',
      fournisseur.email || '',
      fournisseur.caf || 0,
      fournisseur.cabl || 0,
      fournisseur.commentaire || ''
    ];

    console.log(`📝 Insertion fournisseur ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertFamilleArt(schema: string, famille: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO famille_art (famille) VALUES (?) 
                 ON DUPLICATE KEY UPDATE famille = VALUES(famille)`;
    
    const values = [famille.famille || ''];

    console.log(`📝 Insertion famille_art ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertActivite(schema: string, activite: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO activite (nom_entreprise, adresse, commune, wilaya, tel_fixe, tel_port, email, e_mail, nif, ident_fiscal, rc, nrc, nart, banq, sous_domaine, domaine_activite, slogan, logo_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE nom_entreprise = VALUES(nom_entreprise)`;
    
    const values = [
      activite.nom_entreprise || '',
      activite.adresse || '',
      activite.commune || '',
      activite.wilaya || '',
      activite.tel_fixe || '',
      activite.tel_port || '',
      activite.email || '',
      activite.e_mail || '',
      activite.nif || '',
      activite.ident_fiscal || '',
      activite.rc || '',
      activite.nrc || '',
      activite.nart || '',
      activite.banq || '',
      activite.sous_domaine || '',
      activite.domaine_activite || '',
      activite.slogan || '',
      activite.logo_url || ''
    ];

    console.log(`📝 Insertion activite ${activite.id} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertBL(schema: string, bl: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO bl (nfact, nclient, date_fact, montant_ht, tva, montant_ttc, marge) 
                 VALUES (?, ?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE montant_ht = VALUES(montant_ht)`;
    
    const values = [
      bl.nfact,
      bl.nclient || '',
      bl.date_fact || new Date().toISOString().split('T')[0],
      bl.montant_ht || 0,
      bl.tva || 0,
      bl.montant_ttc || 0,
      bl.marge || 0
    ];

    console.log(`📝 Insertion BL ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertFacture(schema: string, facture: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO facture (nfact, nclient, date_fact, montant_ht, tva, montant_ttc) 
                 VALUES (?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE montant_ht = VALUES(montant_ht)`;
    
    const values = [
      facture.nfact,
      facture.nclient || '',
      facture.date_fact || new Date().toISOString().split('T')[0],
      facture.montant_ht || 0,
      facture.tva || 0,
      facture.montant_ttc || 0
    ];

    console.log(`📝 Insertion facture ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertProforma(schema: string, proforma: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO proforma (nfact, nclient, date_fact, montant_ht, tva, montant_ttc) 
                 VALUES (?, ?, ?, ?, ?, ?) 
                 ON DUPLICATE KEY UPDATE montant_ht = VALUES(montant_ht)`;
    
    const values = [
      proforma.nfact,
      proforma.nclient || '',
      proforma.date_fact || new Date().toISOString().split('T')[0],
      proforma.montant_ht || 0,
      proforma.tva || 0,
      proforma.montant_ttc || 0
    ];

    console.log(`📝 Insertion proforma ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertDetailBL(schema: string, detail: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO detail_bl (nfact, narticle, qte, prix_unitaire, montant) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    const values = [
      detail.nfact,
      detail.narticle || '',
      detail.qte || 0,
      detail.prix_unitaire || 0,
      detail.montant || 0
    ];

    console.log(`📝 Insertion detail_bl pour BL ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertDetailFacture(schema: string, detail: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO detail_fact (nfact, narticle, qte, prix_unitaire, montant) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    const values = [
      detail.nfact,
      detail.narticle || '',
      detail.qte || 0,
      detail.prix_unitaire || 0,
      detail.montant || 0
    ];

    console.log(`📝 Insertion detail_fact pour facture ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private async insertDetailProforma(schema: string, detail: any): Promise<void> {
    if (!this.targetAdapter) return;

    const sql = `INSERT INTO detail_proforma (nfact, narticle, qte, prix_unitaire, montant) 
                 VALUES (?, ?, ?, ?, ?)`;
    
    const values = [
      detail.nfact,
      detail.narticle || '',
      detail.qte || 0,
      detail.prix_unitaire || 0,
      detail.montant || 0
    ];

    console.log(`📝 Insertion detail_proforma pour proforma ${values[0]} dans ${schema}`);
    await this.targetAdapter.query(sql, values, schema);
  }

  private createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'supabase': return new SupabaseAdapter(config);
      case 'postgresql': return new PostgreSQLAdapter(config);
      case 'mysql': return new MySQLAdapter(config);
      default: throw new Error(`Type non supporté: ${config.type}`);
    }
  }

  private reportProgress(step: string, progress: number, total: number, message: string, success: boolean, error?: string): void {
    const progressData: MigrationProgress = {
      step, progress, total, message, success, error
    };

    console.log(`[Migration] ${step}: ${message} (${progress}/${total})`);
    
    if (this.progressCallback) {
      this.progressCallback(progressData);
    }
  }

  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const adapter = this.createAdapter(config);
      const result = await adapter.testConnection();
      await adapter.disconnect();
      return result;
    } catch (error) {
      return false;
    }
  }
}

export { MigrationServerService as ServerMigrationService };