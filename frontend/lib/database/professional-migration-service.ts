import { DatabaseConfig, QueryResult } from './types';
import { SupabaseAdapter } from './adapters/supabase-adapter';
import { MySQLAdapter } from './adapters/mysql-adapter';
import { PostgreSQLAdapter } from './adapters/postgresql-adapter';
import { DatabaseAdapter } from './types';
import { AutoDiscoveryService, DiscoveredSchema } from './auto-discovery-service';

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
 * Service de migration professionnel avec découverte automatique
 */
export class ProfessionalMigrationService {
  private sourceAdapter: DatabaseAdapter | null = null;
  private targetAdapter: DatabaseAdapter | null = null;
  private progressCallback?: (progress: MigrationProgress) => void;
  private discoveryService: AutoDiscoveryService | null = null;

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

      // Initialiser le service de découverte
      this.discoveryService = new AutoDiscoveryService(this.sourceAdapter);

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
    if (!this.sourceAdapter || !this.targetAdapter || !this.discoveryService) {
      throw new Error('Migration non initialisée');
    }

    try {
      // Étape 1: Découverte automatique de la structure source
      this.reportProgress('Découverte', 1, 7, 'Découverte automatique de la structure source...', true);
      const discoveredSchemas = await this.discoveryService.discoverCompleteStructure();
      
      if (discoveredSchemas.length === 0) {
        throw new Error('Aucun schéma découvert dans la source');
      }

      console.log(`🎯 Découverte terminée: ${discoveredSchemas.length} schémas, ${discoveredSchemas.reduce((total, schema) => total + schema.tables.length, 0)} tables`);

      // Étape 2: Validation de la découverte
      this.reportProgress('Validation', 2, 7, 'Validation de la structure découverte...', true);
      await this.validateDiscoveredStructure(discoveredSchemas);

      // Étape 3: Nettoyage de la cible
      this.reportProgress('Nettoyage', 3, 7, 'Nettoyage de la base cible...', true);
      await this.cleanupTarget(discoveredSchemas.map(s => s.schemaName));

      // Étape 4: Création des schémas
      this.reportProgress('Schémas', 4, 7, 'Création des schémas...', true);
      await this.createTargetSchemas(discoveredSchemas);

      // Étape 5: Création des tables
      this.reportProgress('Tables', 5, 7, 'Création des tables...', true);
      await this.createTargetTables(discoveredSchemas);

      // Étape 6: Migration des données
      this.reportProgress('Données', 6, 7, 'Migration des données...', true);
      if (options.includeData) {
        await this.migrateAllData(discoveredSchemas);
      }

      // Étape 7: Vérification finale
      this.reportProgress('Vérification', 7, 7, 'Vérification de la migration...', true);
      await this.verifyMigration(discoveredSchemas);

      this.reportProgress('Terminé', 7, 7, 'Migration professionnelle terminée avec succès!', true);
      return true;

    } catch (error) {
      this.reportProgress('Erreur', 0, 7, 'Migration échouée', false,
        error instanceof Error ? error.message : 'Erreur');
      return false;
    }
  }

  private async validateDiscoveredStructure(schemas: DiscoveredSchema[]): Promise<void> {
    for (const schema of schemas) {
      console.log(`✅ Schéma ${schema.schemaName}: ${schema.tables.length} tables`);
      
      for (const table of schema.tables) {
        console.log(`  📋 Table ${table.tableName}: ${table.recordCount} enregistrements, ${table.columns.length} colonnes`);
        
        // Vérifier qu'il y a au moins une clé primaire
        const primaryKeys = table.columns.filter(col => col.isPrimaryKey);
        if (primaryKeys.length === 0) {
          console.warn(`  ⚠️ Table ${table.tableName}: Aucune clé primaire détectée`);
        }
      }
    }
  }

  private async cleanupTarget(schemaNames: string[]): Promise<void> {
    if (!this.targetAdapter) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    
    for (const schemaName of schemaNames) {
      try {
        if (isMySQL) {
          await this.targetAdapter.query(`DROP DATABASE IF EXISTS \`${schemaName}\``, [], 'mysql');
          console.log(`🗑️ Base MySQL ${schemaName} supprimée`);
        } else {
          await this.targetAdapter.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
          console.log(`🗑️ Schéma PostgreSQL ${schemaName} supprimé`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur suppression ${schemaName}:`, error);
      }
    }
  }

  private async createTargetSchemas(schemas: DiscoveredSchema[]): Promise<void> {
    if (!this.targetAdapter) return;

    for (const schema of schemas) {
      try {
        await this.targetAdapter.createSchema(schema.schemaName);
        console.log(`🏗️ Schéma ${schema.schemaName} créé`);
      } catch (error) {
        console.error(`❌ Erreur création schéma ${schema.schemaName}:`, error);
        throw error;
      }
    }
  }

  private async createTargetTables(schemas: DiscoveredSchema[]): Promise<void> {
    if (!this.targetAdapter || !this.discoveryService) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';

    for (const schema of schemas) {
      console.log(`🔨 Création des tables pour ${schema.schemaName}...`);
      
      for (const table of schema.tables) {
        try {
          const createSQL = this.discoveryService.generateCreateTableSQL(table, schema.schemaName, isMySQL);
          
          if (isMySQL) {
            await this.targetAdapter.query(createSQL, [], schema.schemaName);
          } else {
            const prefixedSQL = createSQL.replace('CREATE TABLE IF NOT EXISTS ', `CREATE TABLE IF NOT EXISTS "${schema.schemaName}".`);
            await this.targetAdapter.query(prefixedSQL);
          }
          
          console.log(`  ✅ Table ${table.tableName} créée (${table.columns.length} colonnes)`);
        } catch (error) {
          console.error(`  ❌ Erreur création table ${table.tableName}:`, error);
          throw error;
        }
      }
      
      console.log(`🎯 ${schema.tables.length} tables créées dans ${schema.schemaName}`);
    }
  }

  private async migrateAllData(schemas: DiscoveredSchema[]): Promise<void> {
    if (!this.sourceAdapter || !this.targetAdapter) return;

    const rpcMapping: Record<string, string> = {
      'article': 'get_articles_by_tenant',
      'client': 'get_clients_by_tenant',
      'fournisseur': 'get_fournisseurs_by_tenant',
      'activite': 'get_activites_by_tenant',
      'famille_art': 'get_famille_art_by_tenant',
      'bl': 'get_bls_by_tenant',
      'facture': 'get_factures_by_tenant',
      'proforma': 'get_proformas_by_tenant',
      'detail_bl': 'get_detail_bl_by_tenant',
      'detail_fact': 'get_detail_fact_by_tenant',
      'detail_proforma': 'get_detail_proforma_by_tenant'
    };

    for (const schema of schemas) {
      console.log(`📦 Migration des données pour ${schema.schemaName}...`);
      
      for (const table of schema.tables) {
        const rpcFunction = rpcMapping[table.tableName];
        
        if (!rpcFunction) {
          console.warn(`⚠️ Pas de fonction RPC pour ${table.tableName}, ignoré`);
          continue;
        }

        try {
          // Récupérer les données via RPC
          const result = await this.sourceAdapter.executeRPC(rpcFunction, { p_tenant: schema.schemaName });
          
          if (result.success && result.data && Array.isArray(result.data) && result.data.length > 0) {
            console.log(`  📥 ${result.data.length} enregistrements récupérés pour ${table.tableName}`);
            
            // Insérer les données
            await this.insertTableData(schema.schemaName, table, result.data);
            
            console.log(`  ✅ ${result.data.length} enregistrements migrés pour ${table.tableName}`);
          } else {
            console.log(`  📭 Aucune donnée pour ${table.tableName}`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur migration ${table.tableName}:`, error);
        }
      }
    }
  }

  private async insertTableData(schemaName: string, table: any, data: any[]): Promise<void> {
    if (!this.targetAdapter || data.length === 0) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    const columnNames = table.columns.map((col: any) => col.name);
    
    // Construire l'INSERT
    const placeholders = columnNames.map(() => '?').join(', ');
    const tableName = isMySQL ? `\`${table.tableName}\`` : `"${table.tableName}"`;
    
    const updateClause = isMySQL 
      ? `ON DUPLICATE KEY UPDATE ${columnNames.map((col: string) => `${col} = VALUES(${col})`).join(', ')}`
      : `ON CONFLICT DO NOTHING`;

    const insertSQL = `INSERT INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders}) ${updateClause}`;

    // Insérer chaque enregistrement
    for (const row of data) {
      try {
        const values = columnNames.map((col: string) => row[col] ?? null);
        await this.targetAdapter.query(insertSQL, values, schemaName);
      } catch (error) {
        console.warn(`    ⚠️ Erreur insertion ligne dans ${table.tableName}:`, error);
      }
    }
  }

  private async verifyMigration(schemas: DiscoveredSchema[]): Promise<void> {
    if (!this.targetAdapter) return;

    console.log('🔍 Vérification de la migration...');
    
    for (const schema of schemas) {
      for (const table of schema.tables) {
        try {
          const result = await this.targetAdapter.query(
            `SELECT COUNT(*) as count FROM ${table.tableName}`, 
            [], 
            schema.schemaName
          );
          
          if (result.success && result.data && result.data[0]) {
            const targetCount = result.data[0].count || result.data[0].COUNT;
            console.log(`  ✅ ${schema.schemaName}.${table.tableName}: ${targetCount}/${table.recordCount} enregistrements`);
          }
        } catch (error) {
          console.warn(`  ⚠️ Erreur vérification ${table.tableName}:`, error);
        }
      }
    }
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

    console.log(`[Migration PRO] ${step}: ${message} (${progress}/${total})`);
    
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

export { ProfessionalMigrationService };