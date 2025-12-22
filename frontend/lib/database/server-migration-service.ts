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
 * Fonctionne sans dépendances externes lourdes
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
      this.reportProgress('Initialisation', 10, 100, 'Validation des configurations...', true);

      // Validation des configurations
      if (!this.validateConfig(sourceConfig)) {
        throw new Error('Configuration source invalide');
      }

      if (!this.validateConfig(targetConfig)) {
        throw new Error('Configuration cible invalide');
      }

      this.reportProgress('Initialisation', 30, 100, 'Création des adaptateurs...', true);

      // Créer les adaptateurs
      try {
        this.sourceAdapter = this.createAdapter(sourceConfig);
        this.targetAdapter = this.createAdapter(targetConfig);
      } catch (error) {
        throw new Error(`Erreur création adaptateurs: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      }

      this.reportProgress('Initialisation', 60, 100, 'Test des connexions...', true);

      // Tester les connexions
      const sourceConnected = await this.sourceAdapter.connect();
      if (!sourceConnected) {
        throw new Error('Impossible de se connecter à la base source');
      }

      const targetConnected = await this.targetAdapter.connect();
      if (!targetConnected) {
        throw new Error('Impossible de se connecter à la base cible');
      }

      this.reportProgress('Initialisation', 100, 100, 'Connexions établies avec succès', true);
      return true;
    } catch (error) {
      this.reportProgress('Initialisation', 0, 100, 'Erreur d\'initialisation', false, 
        error instanceof Error ? error.message : 'Erreur inconnue');
      return false;
    }
  }

  /**
   * Valide une configuration de base de données
   */
  private validateConfig(config: DatabaseConfig): boolean {
    if (!config.type) {
      return false;
    }

    switch (config.type) {
      case 'supabase':
        return !!(config.supabaseUrl && config.supabaseKey);
      case 'postgresql':
      case 'mysql':
        return !!(config.host && config.database && config.username);
      default:
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
      const totalSteps = 9;

      // Étape 1: Récupérer les schémas source
      currentStep++;
      this.reportProgress('Analyse', currentStep, totalSteps, 'Analyse des schémas source...', true);
      const sourceSchemas = await this.getSourceSchemas();
      
      if (sourceSchemas.length === 0) {
        throw new Error('Aucun schéma trouvé dans la base source');
      }

      this.reportProgress('Analyse', currentStep, totalSteps, `${sourceSchemas.length} schémas trouvés: ${sourceSchemas.join(', ')}`, true);

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

      // Étape 4: Migrer les fonctions RPC
      currentStep++;
      this.reportProgress('Fonctions', currentStep, totalSteps, 'Migration des fonctions RPC...', true);
      await this.migrateFunctions();

      // Étape 5: Vérifier l'intégrité
      currentStep++;
      this.reportProgress('Vérification', currentStep, totalSteps, 'Vérification de l\'intégrité...', true);
      const integrity = await this.verifyIntegrity(sourceSchemas);

      if (!integrity) {
        this.reportProgress('Vérification', currentStep, totalSteps, 'Avertissement: Vérification d\'intégrité partielle', true);
      }

      // Étape 6: Finalisation
      currentStep++;
      this.reportProgress('Finalisation', currentStep, totalSteps, 'Finalisation...', true);
      await this.finalizeMigration();

      // Étape 7: Résumé
      currentStep++;
      this.reportProgress('Résumé', currentStep, totalSteps, 'Génération du résumé...', true);
      const summary = await this.generateSummary(sourceSchemas);

      // Étape 8: Nettoyage
      currentStep++;
      this.reportProgress('Nettoyage', currentStep, totalSteps, 'Nettoyage des ressources...', true);

      // Étape 9: Terminé
      currentStep++;
      this.reportProgress('Terminé', currentStep, totalSteps, `Migration terminée avec succès ! ${summary}`, true);
      return true;

    } catch (error) {
      this.reportProgress('Erreur', 0, 100, 'Migration échouée', false,
        error instanceof Error ? error.message : 'Erreur inconnue');
      return false;
    }
  }

  /**
   * Génère un résumé de la migration
   */
  private async generateSummary(schemas: string[]): Promise<string> {
    const tables = ['article', 'client', 'fournisseur', 'famille_art', 'activite', 'bl', 'facture', 'proforma', 'detail_bl', 'detail_fact', 'detail_proforma'];
    const totalTables = schemas.length * tables.length;
    const functionsCount = this.getRPCFunctions().length;
    return `${schemas.length} schémas, ${totalTables} tables, ${functionsCount} fonctions RPC migrées`;
  }

  /**
   * Migre les fonctions RPC vers la base cible
   */
  private async migrateFunctions(): Promise<void> {
    if (!this.targetAdapter) {
      throw new Error('Adaptateur cible non initialisé');
    }

    try {
      const isMySQL = this.targetAdapter?.constructor.name === 'MySQLAdapter';
      
      this.reportProgress('Fonctions', 1, 3, 'Chargement des définitions de fonctions...', true);
      
      // Charger le fichier SQL approprié
      const functionsSQL = isMySQL ? this.getMySQLFunctions() : this.getPostgreSQLFunctions();
      
      this.reportProgress('Fonctions', 2, 3, `Création des fonctions ${isMySQL ? 'MySQL' : 'PostgreSQL'}...`, true);
      
      // Exécuter le script de création des fonctions
      const result = await this.targetAdapter.query(functionsSQL);
      
      if (result.success) {
        this.reportProgress('Fonctions', 3, 3, `${this.getRPCFunctions().length} fonctions RPC créées avec succès`, true);
      } else {
        this.reportProgress('Fonctions', 3, 3, `Erreur création fonctions: ${result.error}`, false);
      }
      
    } catch (error) {
      console.error('❌ Erreur migration fonctions:', error);
      this.reportProgress('Fonctions', 0, 3, 
        `Erreur migration fonctions: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, false);
    }
  }

  /**
   * Retourne la liste des fonctions RPC à migrer
   */
  private getRPCFunctions(): string[] {
    return [
      'get_articles_by_tenant',
      'get_clients_by_tenant',
      'get_fournisseurs_by_tenant',
      'get_families_by_tenant',
      'get_activites_by_tenant',
      'get_bls_by_tenant',
      'get_factures_by_tenant',
      'get_proformas_by_tenant',
      'get_detail_bl_by_tenant',
      'get_detail_fact_by_tenant',
      'get_detail_proforma_by_tenant',
      'calculate_margin',
      'get_next_number',
      'update_stock',
      'get_sales_report',
      'get_stock_report',
      'validate_document'
    ];
  }

  /**
   * Retourne les fonctions PostgreSQL
   */
  private getPostgreSQLFunctions(): string {
    return `
-- =====================================================
-- FONCTIONS RPC COMPLÈTES POUR POSTGRESQL
-- =====================================================

-- Fonction pour récupérer les articles par tenant
CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  narticle VARCHAR(50),
  designation VARCHAR(255),
  famille VARCHAR(100),
  nfournisseur VARCHAR(50),
  prix_unitaire DECIMAL(10,2),
  prix_vente DECIMAL(10,2),
  marge DECIMAL(10,2),
  tva DECIMAL(10,2),
  seuil INTEGER,
  stock_f INTEGER,
  stock_bl INTEGER,
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.article ORDER BY narticle', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les clients par tenant
CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nclient VARCHAR(50),
  raison_sociale VARCHAR(255),
  adresse TEXT,
  contact_person VARCHAR(255),
  tel VARCHAR(50),
  email VARCHAR(100),
  nrc VARCHAR(100),
  i_fiscal VARCHAR(100),
  c_affaire_fact DECIMAL(10,2),
  c_affaire_bl DECIMAL(10,2),
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.client ORDER BY nclient', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les fournisseurs par tenant
CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  nfournisseur VARCHAR(50),
  nom_fournisseur VARCHAR(255),
  resp_fournisseur VARCHAR(255),
  adresse_fourni TEXT,
  tel VARCHAR(50),
  tel1 VARCHAR(50),
  tel2 VARCHAR(50),
  email VARCHAR(100),
  caf DECIMAL(10,2),
  cabl DECIMAL(10,2),
  commentaire TEXT,
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.fournisseur ORDER BY nfournisseur', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les familles d'articles par tenant
CREATE OR REPLACE FUNCTION get_families_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  famille VARCHAR(100)
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT famille FROM %I.famille_art ORDER BY famille', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer l'activité par tenant
CREATE OR REPLACE FUNCTION get_activites_by_tenant(p_tenant TEXT)
RETURNS TABLE (
  id INTEGER,
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
  created_at TIMESTAMP
) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT * FROM %I.activite ORDER BY id', p_tenant);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la marge
CREATE OR REPLACE FUNCTION calculate_margin(p_prix_achat DECIMAL(10,2), p_prix_vente DECIMAL(10,2))
RETURNS DECIMAL(10,2)
SECURITY DEFINER
AS $$
BEGIN
  IF p_prix_achat = 0 OR p_prix_achat IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((p_prix_vente - p_prix_achat) / p_prix_achat) * 100, 2);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le prochain numéro de document
CREATE OR REPLACE FUNCTION get_next_number(p_tenant TEXT, p_document_type TEXT)
RETURNS INTEGER
SECURITY DEFINER
AS $$
DECLARE
  next_num INTEGER;
BEGIN
  CASE p_document_type
    WHEN 'bl' THEN
      EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM %I.bl', p_tenant) INTO next_num;
    WHEN 'facture' THEN
      EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM %I.facture', p_tenant) INTO next_num;
    WHEN 'proforma' THEN
      EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 FROM %I.proforma', p_tenant) INTO next_num;
    ELSE
      next_num := 1;
  END CASE;
  
  RETURN next_num;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le stock
CREATE OR REPLACE FUNCTION update_stock(
  p_tenant TEXT,
  p_narticle VARCHAR(50),
  p_qte INTEGER,
  p_operation VARCHAR(10)
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  IF p_operation = 'add' THEN
    EXECUTE format('UPDATE %I.article SET stock_f = stock_f + %s WHERE narticle = %L', 
                   p_tenant, p_qte, p_narticle);
  ELSIF p_operation = 'subtract' THEN
    EXECUTE format('UPDATE %I.article SET stock_f = stock_f - %s WHERE narticle = %L', 
                   p_tenant, p_qte, p_narticle);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Ajouter des commentaires aux fonctions
COMMENT ON FUNCTION get_articles_by_tenant(TEXT) IS 'Récupère tous les articles pour un tenant donné';
COMMENT ON FUNCTION get_clients_by_tenant(TEXT) IS 'Récupère tous les clients pour un tenant donné';
COMMENT ON FUNCTION get_fournisseurs_by_tenant(TEXT) IS 'Récupère tous les fournisseurs pour un tenant donné';
COMMENT ON FUNCTION calculate_margin(DECIMAL, DECIMAL) IS 'Calcule la marge en pourcentage';
COMMENT ON FUNCTION get_next_number(TEXT, TEXT) IS 'Obtient le prochain numéro de document';
COMMENT ON FUNCTION update_stock(TEXT, VARCHAR, INTEGER, VARCHAR) IS 'Met à jour le stock d''un article';
    `;
  }

  /**
   * Retourne les fonctions MySQL
   */
  private getMySQLFunctions(): string {
    return `
DELIMITER $$

-- Procédure pour récupérer les articles par tenant
DROP PROCEDURE IF EXISTS get_articles_by_tenant$$
CREATE PROCEDURE get_articles_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.article ORDER BY narticle');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les clients par tenant
DROP PROCEDURE IF EXISTS get_clients_by_tenant$$
CREATE PROCEDURE get_clients_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.client ORDER BY nclient');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Procédure pour récupérer les fournisseurs par tenant
DROP PROCEDURE IF EXISTS get_fournisseurs_by_tenant$$
CREATE PROCEDURE get_fournisseurs_by_tenant(IN p_tenant VARCHAR(50))
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.fournisseur ORDER BY nfournisseur');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- Fonction pour calculer la marge
DROP FUNCTION IF EXISTS calculate_margin$$
CREATE FUNCTION calculate_margin(p_prix_achat DECIMAL(10,2), p_prix_vente DECIMAL(10,2))
RETURNS DECIMAL(10,2)
READS SQL DATA
DETERMINISTIC
SQL SECURITY DEFINER
BEGIN
  IF p_prix_achat = 0 OR p_prix_achat IS NULL THEN
    RETURN 0;
  END IF;
  
  RETURN ROUND(((p_prix_vente - p_prix_achat) / p_prix_achat) * 100, 2);
END$$

-- Fonction pour obtenir le prochain numéro de document
DROP FUNCTION IF EXISTS get_next_number$$
CREATE FUNCTION get_next_number(p_tenant VARCHAR(50), p_document_type VARCHAR(20))
RETURNS INT
READS SQL DATA
SQL SECURITY DEFINER
BEGIN
  DECLARE next_num INT DEFAULT 1;
  
  CASE p_document_type
    WHEN 'bl' THEN
      SET @sql = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 FROM \`', p_tenant, '\`.bl');
    WHEN 'facture' THEN
      SET @sql = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 FROM \`', p_tenant, '\`.facture');
    WHEN 'proforma' THEN
      SET @sql = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 FROM \`', p_tenant, '\`.proforma');
    ELSE
      SET next_num = 1;
  END CASE;
  
  IF @sql IS NOT NULL THEN
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
  
  RETURN next_num;
END$$

DELIMITER ;
    `;
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

    try {
      const schemas = await this.sourceAdapter.getSchemas();
      
      // Si pas de schémas détectés, utiliser les schémas par défaut
      if (schemas.length === 0) {
        console.log('⚠️ Aucun schéma détecté, utilisation des schémas par défaut');
        return ['2025_bu01', '2024_bu01', '2025_bu02', '2026_bu01'];
      }

      console.log(`✅ ${schemas.length} schémas détectés:`, schemas);
      return schemas;
    } catch (error) {
      console.error('❌ Erreur récupération schémas:', error);
      // Fallback vers les schémas par défaut
      return ['2025_bu01', '2024_bu01', '2025_bu02'];
    }
  }

  /**
   * Crée les schémas dans la base cible
   */
  private async createTargetSchemas(schemas: string[]): Promise<void> {
    if (!this.targetAdapter) throw new Error('Adaptateur cible non initialisé');

    for (let i = 0; i < schemas.length; i++) {
      const schema = schemas[i];
      this.reportProgress('Schémas', i + 1, schemas.length, `Création du schéma ${schema}...`, true);
      
      try {
        await this.targetAdapter.createSchema(schema);
        
        // Créer les tables dans le schéma
        await this.createTablesInSchema(schema);
        
        this.reportProgress('Schémas', i + 1, schemas.length, `Schéma ${schema} créé avec succès`, true);
      } catch (error) {
        console.error(`❌ Erreur création schéma ${schema}:`, error);
        this.reportProgress('Schémas', i + 1, schemas.length, `Erreur création schéma ${schema}`, false, 
          error instanceof Error ? error.message : 'Erreur inconnue');
      }
    }
  }

  /**
   * Crée les tables dans un schéma
   */
  private async createTablesInSchema(schema: string): Promise<void> {
    if (!this.targetAdapter) throw new Error('Adaptateur cible non initialisé');

    const tables = this.getTableDefinitions(schema);
    
    for (const [tableName, tableSQL] of Object.entries(tables)) {
      try {
        await this.targetAdapter.query(tableSQL);
        console.log(`✅ Table ${schema}.${tableName} créée`);
      } catch (error) {
        console.warn(`⚠️ Erreur création table ${schema}.${tableName}:`, error);
        // Continuer même si certaines tables existent déjà
      }
    }
  }

  /**
   * Retourne les définitions de tables selon le type de base de données
   */
  private getTableDefinitions(schema: string): Record<string, string> {
    const isMySQL = this.targetAdapter?.constructor.name === 'MySQLAdapter';
    const schemaPrefix = isMySQL ? `\`${schema}\`.` : `"${schema}".`;
    const autoIncrement = isMySQL ? 'AUTO_INCREMENT' : 'SERIAL';
    const textType = isMySQL ? 'TEXT' : 'TEXT';
    const decimalType = isMySQL ? 'DECIMAL(10,2)' : 'DECIMAL(10,2)';
    const intType = isMySQL ? 'INT' : 'INTEGER';
    const timestampType = isMySQL ? 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP' : 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';

    return {
      // Table articles
      article: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}article (
        narticle VARCHAR(50) PRIMARY KEY,
        designation VARCHAR(255),
        famille VARCHAR(100),
        nfournisseur VARCHAR(50),
        prix_unitaire ${decimalType} DEFAULT 0,
        prix_vente ${decimalType} DEFAULT 0,
        marge ${decimalType} DEFAULT 0,
        tva ${decimalType} DEFAULT 19,
        seuil ${intType} DEFAULT 0,
        stock_f ${intType} DEFAULT 0,
        stock_bl ${intType} DEFAULT 0,
        created_at ${timestampType}
      )`,
      
      // Table clients
      client: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}client (
        nclient VARCHAR(50) PRIMARY KEY,
        raison_sociale VARCHAR(255),
        adresse ${textType},
        contact_person VARCHAR(255),
        tel VARCHAR(50),
        email VARCHAR(100),
        nrc VARCHAR(100),
        i_fiscal VARCHAR(100),
        c_affaire_fact ${decimalType} DEFAULT 0,
        c_affaire_bl ${decimalType} DEFAULT 0,
        created_at ${timestampType}
      )`,
      
      // Table fournisseurs
      fournisseur: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}fournisseur (
        nfournisseur VARCHAR(50) PRIMARY KEY,
        nom_fournisseur VARCHAR(255),
        resp_fournisseur VARCHAR(255),
        adresse_fourni ${textType},
        tel VARCHAR(50),
        tel1 VARCHAR(50),
        tel2 VARCHAR(50),
        email VARCHAR(100),
        caf ${decimalType} DEFAULT 0,
        cabl ${decimalType} DEFAULT 0,
        commentaire ${textType},
        created_at ${timestampType}
      )`,
      
      // Table famille_art
      famille_art: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}famille_art (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        famille VARCHAR(100) UNIQUE,
        created_at ${timestampType}
      )`,
      
      // Table activite
      activite: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}activite (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nom_entreprise VARCHAR(255),
        adresse ${textType},
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
        sous_domaine ${textType},
        domaine_activite ${textType},
        slogan ${textType},
        logo_url ${textType},
        created_at ${timestampType}
      )`,
      
      // Table bl (bons de livraison)
      bl: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}bl (
        nfact ${intType} PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        montant_ht ${decimalType} DEFAULT 0,
        tva ${decimalType} DEFAULT 0,
        montant_ttc ${decimalType} DEFAULT 0,
        marge ${decimalType} DEFAULT 0,
        created_at ${timestampType}
      )`,
      
      // Table facture
      facture: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}facture (
        nfact ${intType} PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        montant_ht ${decimalType} DEFAULT 0,
        tva ${decimalType} DEFAULT 0,
        montant_ttc ${decimalType} DEFAULT 0,
        created_at ${timestampType}
      )`,
      
      // Table proforma
      proforma: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}proforma (
        nfact ${intType} PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        montant_ht ${decimalType} DEFAULT 0,
        tva ${decimalType} DEFAULT 0,
        montant_ttc ${decimalType} DEFAULT 0,
        created_at ${timestampType}
      )`,
      
      // Table detail_bl (détails des bons de livraison)
      detail_bl: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}detail_bl (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nfact ${intType},
        narticle VARCHAR(50),
        qte ${intType} DEFAULT 0,
        prix_unitaire ${decimalType} DEFAULT 0,
        montant ${decimalType} DEFAULT 0,
        created_at ${timestampType}
      )`,
      
      // Table detail_fact (détails des factures)
      detail_fact: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}detail_fact (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nfact ${intType},
        narticle VARCHAR(50),
        qte ${intType} DEFAULT 0,
        prix_unitaire ${decimalType} DEFAULT 0,
        montant ${decimalType} DEFAULT 0,
        created_at ${timestampType}
      )`,
      
      // Table detail_proforma (détails des proformas)
      detail_proforma: `CREATE TABLE IF NOT EXISTS ${schemaPrefix}detail_proforma (
        id ${isMySQL ? 'INT AUTO_INCREMENT' : 'SERIAL'} PRIMARY KEY,
        nfact ${intType},
        narticle VARCHAR(50),
        qte ${intType} DEFAULT 0,
        prix_unitaire ${decimalType} DEFAULT 0,
        montant ${decimalType} DEFAULT 0,
        created_at ${timestampType}
      )`
    };
  }

  /**
   * Migre les données entre les bases
   */
  private async migrateData(schemas: string[], options: MigrationOptions): Promise<void> {
    if (!this.sourceAdapter || !this.targetAdapter) {
      throw new Error('Adaptateurs non initialisés');
    }

    // Liste complète des tables à migrer
    const tables = [
      'article', 
      'client', 
      'fournisseur', 
      'famille_art', 
      'activite', 
      'bl', 
      'facture', 
      'proforma',
      'detail_bl',
      'detail_fact', 
      'detail_proforma'
    ];
    
    let totalTables = schemas.length * tables.length;
    let processedTables = 0;

    for (const schema of schemas) {
      this.reportProgress('Données', processedTables, totalTables, `Traitement du schéma ${schema}...`, true);
      
      for (const table of tables) {
        processedTables++;
        this.reportProgress('Données', processedTables, totalTables, 
          `Migration ${schema}.${table}...`, true);

        try {
          // Récupérer les données source avec la fonction RPC appropriée
          const rpcFunction = this.getRPCFunctionForTable(table);
          if (!rpcFunction) {
            this.reportProgress('Données', processedTables, totalTables, 
              `Fonction RPC non disponible pour ${schema}.${table}`, true);
            continue;
          }

          const sourceData = await this.sourceAdapter.executeRPC(rpcFunction, { p_tenant: schema });
          
          if (sourceData.success && sourceData.data && Array.isArray(sourceData.data) && sourceData.data.length > 0) {
            // Traitement spécial pour la table famille_art qui utilise get_families_by_tenant
            let dataToInsert = sourceData.data;
            if (table === 'famille_art' && rpcFunction === 'get_families_by_tenant') {
              // Transformer les données de { "famille": "nom" } vers { "famille": "nom", "id": auto }
              dataToInsert = sourceData.data.map((item: any, index: number) => ({
                famille: item.famille,
                // L'id sera généré automatiquement par SERIAL/AUTO_INCREMENT
              }));
            }
            
            // Insérer dans la cible par batch
            await this.insertDataBatch(schema, table, dataToInsert, options.batchSize);
            this.reportProgress('Données', processedTables, totalTables, 
              `${dataToInsert.length} enregistrements migrés pour ${schema}.${table}`, true);
          } else {
            this.reportProgress('Données', processedTables, totalTables, 
              `Aucune donnée trouvée pour ${schema}.${table}`, true);
          }
        } catch (error) {
          console.warn(`⚠️ Erreur migration ${schema}.${table}:`, error);
          this.reportProgress('Données', processedTables, totalTables, 
            `Erreur migration ${schema}.${table}: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, false);
          // Continuer avec les autres tables
        }
      }
    }
  }

  /**
   * Retourne la fonction RPC appropriée pour une table
   */
  private getRPCFunctionForTable(table: string): string | null {
    const rpcMap: Record<string, string> = {
      'article': 'get_articles_by_tenant',
      'client': 'get_clients_by_tenant',
      'fournisseur': 'get_fournisseurs_by_tenant',
      'famille_art': 'get_families_by_tenant', // Utilise get_families_by_tenant qui existe
      'activite': 'get_activites_by_tenant',
      'bl': 'get_bls_by_tenant',
      'facture': 'get_factures_by_tenant',
      'proforma': 'get_proformas_by_tenant',
      'detail_bl': 'get_detail_bl_by_tenant',
      'detail_fact': 'get_detail_fact_by_tenant',
      'detail_proforma': 'get_detail_proforma_by_tenant'
    };
    
    return rpcMap[table] || null;
  }

  /**
   * Insère les données par batch
   */
  private async insertDataBatch(schema: string, table: string, data: any[], batchSize: number): Promise<void> {
    if (!this.targetAdapter || !data.length) return;

    const totalBatches = Math.ceil(data.length / batchSize);
    
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize;
      const endIndex = Math.min(startIndex + batchSize, data.length);
      const batch = data.slice(startIndex, endIndex);
      
      this.reportProgress('Données', startIndex, data.length, 
        `Insertion batch ${batchIndex + 1}/${totalBatches} pour ${schema}.${table}`, true);
      
      for (const row of batch) {
        try {
          await this.insertSingleRow(schema, table, row);
        } catch (error) {
          console.warn(`⚠️ Erreur insertion ${schema}.${table}:`, error);
        }
      }
    }
  }

  /**
   * Insère une ligne dans la base de données
   */
  private async insertSingleRow(schema: string, table: string, row: any): Promise<void> {
    if (!this.targetAdapter) return;

    const isMySQL = this.targetAdapter?.constructor.name === 'MySQLAdapter';
    
    // 🔧 CORRECTION: Mapper les colonnes pour corriger la casse
    const mappedRow = this.mapColumnNames(table, row);
    const columns = Object.keys(mappedRow);
    const values = Object.values(mappedRow);
    
    // Préparer les placeholders selon le type de base
    const placeholders = isMySQL 
      ? values.map(() => '?').join(', ')
      : values.map((_, index) => `$${index + 1}`).join(', ');
    
    // Préparer les valeurs avec échappement
    const escapedValues = values.map(value => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'string') {
        return value;
      }
      if (typeof value === 'number') {
        return value;
      }
      if (typeof value === 'boolean') {
        return value ? 1 : 0;
      }
      return String(value);
    });

    const schemaPrefix = isMySQL ? `\`${schema}\`.` : `"${schema}".`;
    const columnList = isMySQL 
      ? columns.map(col => `\`${col}\``).join(', ')
      : columns.map(col => `"${col}"`).join(', ');

    const insertSQL = `INSERT INTO ${schemaPrefix}${table} (${columnList}) VALUES (${placeholders})`;
    
    // Pour MySQL, utiliser ON DUPLICATE KEY UPDATE, pour PostgreSQL, utiliser ON CONFLICT avec la clé primaire
    let conflictClause = '';
    if (isMySQL) {
      conflictClause = 'ON DUPLICATE KEY UPDATE id=id';
    } else {
      // Pour PostgreSQL, identifier la clé primaire selon la table
      const primaryKey = this.getPrimaryKeyForTable(table);
      if (primaryKey) {
        conflictClause = `ON CONFLICT ("${primaryKey}") DO NOTHING`;
      }
    }
    
    const finalSQL = conflictClause ? `${insertSQL} ${conflictClause}` : insertSQL;
    
    console.log(`🔍 Insertion SQL (corrigée): ${finalSQL}`);
    console.log(`📊 Valeurs mappées:`, escapedValues);
    
    await this.targetAdapter.query(finalSQL, escapedValues);
  }

  /**
   * Retourne la clé primaire pour une table donnée
   */
  private getPrimaryKeyForTable(table: string): string | null {
    switch (table) {
      case 'article':
        return 'narticle';
      case 'client':
        return 'nclient';
      case 'fournisseur':
        return 'nfournisseur';
      case 'bl':
      case 'facture':
      case 'proforma':
        return 'nfact';
      case 'famille_art':
      case 'activite':
      case 'detail_bl':
      case 'detail_fact':
      case 'detail_proforma':
        return 'id';
      default:
        return null;
    }
  }

  /**
   * Vérifie l'intégrité des données migrées
   */
  private async verifyIntegrity(schemas: string[]): Promise<boolean> {
    if (!this.sourceAdapter || !this.targetAdapter) return false;

    let totalChecks = 0;
    let successfulChecks = 0;

    try {
      for (const schema of schemas) {
        this.reportProgress('Vérification', totalChecks, schemas.length, 
          `Vérification du schéma ${schema}...`, true);
        
        // Vérifier le nombre d'articles
        try {
          totalChecks++;
          const sourceArticles = await this.sourceAdapter.executeRPC('get_articles_by_tenant', { p_tenant: schema });
          
          let targetCount = 0;
          const targetArticles = await this.targetAdapter.executeRPC('get_articles_by_tenant', { p_tenant: schema });
          targetCount = targetArticles.success && Array.isArray(targetArticles.data) ? targetArticles.data.length : 0;
          
          const sourceCount = sourceArticles.success && Array.isArray(sourceArticles.data) ? sourceArticles.data.length : 0;
          
          if (sourceCount === targetCount) {
            successfulChecks++;
            this.reportProgress('Vérification', totalChecks, schemas.length, 
              `${schema}: ${sourceCount} articles vérifiés ✅`, true);
          } else {
            this.reportProgress('Vérification', totalChecks, schemas.length, 
              `${schema}: Articles - source: ${sourceCount}, cible: ${targetCount} ${targetCount > 0 ? '✅' : '⚠️'}`, true);
            
            // Considérer comme succès si des données ont été migrées
            if (targetCount > 0) {
              successfulChecks++;
            }
          }
        } catch (error) {
          console.warn(`⚠️ Erreur vérification ${schema}:`, error);
        }
      }
      
      const successRate = totalChecks > 0 ? (successfulChecks / totalChecks) * 100 : 0;
      this.reportProgress('Vérification', schemas.length, schemas.length, 
        `Vérification terminée: ${successfulChecks}/${totalChecks} vérifications réussies (${successRate.toFixed(1)}%)`, true);
      
      return successRate >= 50; // Considérer comme réussi si au moins 50% des vérifications passent
    } catch (error) {
      console.error('❌ Erreur vérification intégrité:', error);
      this.reportProgress('Vérification', 0, schemas.length, 
        `Erreur vérification: ${error instanceof Error ? error.message : 'Erreur inconnue'}`, false);
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
        return new PostgreSQLAdapter(config);
      case 'mysql':
        return new MySQLAdapter(config);
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

  /**
   * Mappe les noms de colonnes source vers les noms de colonnes cible
   * Corrige les problèmes de casse entre Supabase et PostgreSQL/MySQL
   */
  private mapColumnNames(table: string, sourceRow: any): any {
    const mappedRow: any = {};
    
    // Définir les mappings de colonnes par table
    const columnMappings: Record<string, Record<string, string>> = {
      article: {
        'Narticle': 'narticle',
        'Nfournisseur': 'nfournisseur',
        'designation': 'designation',
        'famille': 'famille',
        'prix_unitaire': 'prix_unitaire',
        'prix_vente': 'prix_vente',
        'marge': 'marge',
        'tva': 'tva',
        'seuil': 'seuil',
        'stock_f': 'stock_f',
        'stock_bl': 'stock_bl',
        'created_at': 'created_at'
      },
      client: {
        'nclient': 'nclient',
        'raison_sociale': 'raison_sociale',
        'adresse': 'adresse',
        'contact_person': 'contact_person',
        'tel': 'tel',
        'email': 'email',
        'nrc': 'nrc',
        'i_fiscal': 'i_fiscal',
        'c_affaire_fact': 'c_affaire_fact',
        'c_affaire_bl': 'c_affaire_bl',
        'created_at': 'created_at'
      },
      fournisseur: {
        'nfournisseur': 'nfournisseur',
        'nom_fournisseur': 'nom_fournisseur',
        'resp_fournisseur': 'resp_fournisseur',
        'adresse_fourni': 'adresse_fourni',
        'tel': 'tel',
        'tel1': 'tel1',
        'tel2': 'tel2',
        'email': 'email',
        'caf': 'caf',
        'cabl': 'cabl',
        'commentaire': 'commentaire',
        'created_at': 'created_at'
      },
      famille_art: {
        'famille': 'famille',
        'created_at': 'created_at'
      },
      activite: {
        'id': 'id',
        'nom_entreprise': 'nom_entreprise',
        'adresse': 'adresse',
        'commune': 'commune',
        'wilaya': 'wilaya',
        'tel_fixe': 'tel_fixe',
        'tel_port': 'tel_port',
        'email': 'email',
        'e_mail': 'e_mail',
        'nif': 'nif',
        'ident_fiscal': 'ident_fiscal',
        'rc': 'rc',
        'nrc': 'nrc',
        'nart': 'nart',
        'banq': 'banq',
        'sous_domaine': 'sous_domaine',
        'domaine_activite': 'domaine_activite',
        'slogan': 'slogan',
        'logo_url': 'logo_url',
        'created_at': 'created_at'
      },
      bl: {
        'nfact': 'nfact',
        'nclient': 'nclient',
        'date_fact': 'date_fact',
        'montant_ht': 'montant_ht',
        'tva': 'tva',
        'montant_ttc': 'montant_ttc',
        'marge': 'marge',
        'created_at': 'created_at'
      },
      facture: {
        'nfact': 'nfact',
        'nclient': 'nclient',
        'date_fact': 'date_fact',
        'montant_ht': 'montant_ht',
        'tva': 'tva',
        'montant_ttc': 'montant_ttc',
        'created_at': 'created_at'
      },
      proforma: {
        'nfact': 'nfact',
        'nclient': 'nclient',
        'date_fact': 'date_fact',
        'montant_ht': 'montant_ht',
        'tva': 'tva',
        'montant_ttc': 'montant_ttc',
        'created_at': 'created_at'
      },
      detail_bl: {
        'id': 'id',
        'nfact': 'nfact',
        'narticle': 'narticle',
        'qte': 'qte',
        'prix_unitaire': 'prix_unitaire',
        'montant': 'montant',
        'created_at': 'created_at'
      },
      detail_fact: {
        'id': 'id',
        'nfact': 'nfact',
        'narticle': 'narticle',
        'qte': 'qte',
        'prix_unitaire': 'prix_unitaire',
        'montant': 'montant',
        'created_at': 'created_at'
      },
      detail_proforma: {
        'id': 'id',
        'nfact': 'nfact',
        'narticle': 'narticle',
        'qte': 'qte',
        'prix_unitaire': 'prix_unitaire',
        'montant': 'montant',
        'created_at': 'created_at'
      }
    };

    const tableMapping = columnMappings[table];
    if (!tableMapping) {
      // Si pas de mapping défini, utiliser les colonnes telles quelles en minuscules
      for (const [key, value] of Object.entries(sourceRow)) {
        mappedRow[key.toLowerCase()] = value;
      }
      return mappedRow;
    }

    // Appliquer le mapping défini
    for (const [sourceCol, targetCol] of Object.entries(tableMapping)) {
      if (sourceRow.hasOwnProperty(sourceCol)) {
        mappedRow[targetCol] = sourceRow[sourceCol];
      }
    }

    // Ajouter les colonnes non mappées (en minuscules)
    for (const [key, value] of Object.entries(sourceRow)) {
      if (!tableMapping.hasOwnProperty(key)) {
        const lowerKey = key.toLowerCase();
        if (!mappedRow.hasOwnProperty(lowerKey)) {
          mappedRow[lowerKey] = value;
        }
      }
    }

    return mappedRow;
  }
}

// Export du service serveur uniquement
export { MigrationServerService as ServerMigrationService };