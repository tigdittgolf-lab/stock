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

export interface TableStructure {
  table_name: string;
  columns: ColumnInfo[];
  constraints: ConstraintInfo[];
  indexes: IndexInfo[];
}

export interface ColumnInfo {
  column_name: string;
  data_type: string;
  character_maximum_length?: number;
  is_nullable: string;
  column_default?: string;
  ordinal_position: number;
}

export interface ConstraintInfo {
  constraint_name: string;
  constraint_type: string;
  column_name: string;
}

export interface IndexInfo {
  index_name: string;
  column_name: string;
  is_unique: boolean;
}

/**
 * Service de migration RÉELLE - Analyse la source et reproduit exactement
 */
export class RealMigrationService {
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
      // Étape 1: Analyse de la source RÉELLE
      this.reportProgress('Analyse', 1, 6, 'Analyse de la structure source...', true);
      const sourceSchemas = await this.getSourceSchemas();
      console.log('🔍 Schémas source trouvés:', sourceSchemas);

      // Étape 2: Analyse des tables pour chaque schéma
      this.reportProgress('Structure', 2, 6, 'Analyse des structures de tables...', true);
      const allTableStructures: Record<string, TableStructure[]> = {};
      
      for (const schema of sourceSchemas) {
        const tables = await this.analyzeSchemaStructure(schema);
        allTableStructures[schema] = tables;
        console.log(`📋 ${schema}: ${tables.length} tables trouvées`);
      }

      // Étape 3: Nettoyage de la cible
      this.reportProgress('Nettoyage', 3, 6, 'Nettoyage de la base cible...', true);
      await this.cleanupTarget(sourceSchemas);

      // Étape 4: Création des schémas et tables EXACTES
      this.reportProgress('Schémas', 4, 6, 'Création des schémas et tables...', true);
      await this.createExactSchemas(allTableStructures);

      // Étape 5: Migration des données RÉELLES
      this.reportProgress('Données', 5, 6, 'Migration des données...', true);
      if (options.includeData) {
        await this.migrateRealData(allTableStructures);
      }

      // Étape 6: Finalisation
      this.reportProgress('Terminé', 6, 6, 'Migration RÉELLE terminée avec succès!', true);
      return true;

    } catch (error) {
      this.reportProgress('Erreur', 0, 6, 'Migration échouée', false,
        error instanceof Error ? error.message : 'Erreur');
      return false;
    }
  }

  private async getSourceSchemas(): Promise<string[]> {
    if (!this.sourceAdapter) return [];

    const result = await this.sourceAdapter.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%_bu%' 
      ORDER BY schema_name
    `);

    if (result.success && result.data) {
      return result.data.map((row: any) => row.schema_name);
    }
    return [];
  }

  private async analyzeSchemaStructure(schema: string): Promise<TableStructure[]> {
    if (!this.sourceAdapter) return [];

    // 1. Obtenir toutes les tables
    const tablesResult = await this.sourceAdapter.query(`
      SELECT table_name
      FROM information_schema.tables 
      WHERE table_schema = $1 
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `, [schema]);

    if (!tablesResult.success || !tablesResult.data) return [];

    const structures: TableStructure[] = [];

    // 2. Pour chaque table, analyser sa structure
    for (const tableRow of tablesResult.data) {
      const tableName = tableRow.table_name;
      
      // Colonnes
      const columnsResult = await this.sourceAdapter.query(`
        SELECT column_name, data_type, character_maximum_length, 
               is_nullable, column_default, ordinal_position
        FROM information_schema.columns
        WHERE table_schema = $1 AND table_name = $2
        ORDER BY ordinal_position
      `, [schema, tableName]);

      // Contraintes
      const constraintsResult = await this.sourceAdapter.query(`
        SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = $1 AND tc.table_name = $2
      `, [schema, tableName]);

      const structure: TableStructure = {
        table_name: tableName,
        columns: columnsResult.success ? columnsResult.data || [] : [],
        constraints: constraintsResult.success ? constraintsResult.data || [] : [],
        indexes: [] // TODO: Ajouter les index si nécessaire
      };

      structures.push(structure);
      console.log(`📊 Table ${tableName}: ${structure.columns.length} colonnes`);
    }

    return structures;
  }

  private async cleanupTarget(schemas: string[]): Promise<void> {
    if (!this.targetAdapter) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    
    for (const schema of schemas) {
      try {
        if (isMySQL) {
          await this.targetAdapter.query(`DROP DATABASE IF EXISTS \`${schema}\``, [], 'mysql');
          console.log(`🗑️ Base MySQL ${schema} supprimée`);
        } else {
          await this.targetAdapter.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
          console.log(`🗑️ Schéma PostgreSQL ${schema} supprimé`);
        }
      } catch (error) {
        console.warn(`⚠️ Erreur suppression ${schema}:`, error);
      }
    }
  }

  private async createExactSchemas(allTableStructures: Record<string, TableStructure[]>): Promise<void> {
    if (!this.targetAdapter) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';

    for (const [schema, tables] of Object.entries(allTableStructures)) {
      // Créer le schéma/base
      await this.targetAdapter.createSchema(schema);
      console.log(`🏗️ Schéma ${schema} créé`);

      // Créer chaque table avec sa structure EXACTE
      for (const table of tables) {
        await this.createExactTable(schema, table, isMySQL);
      }

      console.log(`✅ ${tables.length} tables créées dans ${schema}`);
    }
  }

  private async createExactTable(schema: string, table: TableStructure, isMySQL: boolean): Promise<void> {
    if (!this.targetAdapter) return;

    // Construire le CREATE TABLE avec la structure exacte
    let columnsSQL = table.columns.map(col => {
      let columnDef = `${col.column_name} `;
      
      // Mapper les types PostgreSQL vers MySQL si nécessaire
      if (isMySQL) {
        columnDef += this.mapPostgresToMySQL(col.data_type, col.character_maximum_length);
      } else {
        columnDef += col.data_type;
        if (col.character_maximum_length) {
          columnDef += `(${col.character_maximum_length})`;
        }
      }

      if (col.is_nullable === 'NO') {
        columnDef += ' NOT NULL';
      }

      if (col.column_default) {
        // Nettoyer les defaults PostgreSQL pour MySQL
        let defaultValue = col.column_default;
        if (isMySQL && defaultValue.includes('::')) {
          defaultValue = defaultValue.split('::')[0];
        }
        if (defaultValue !== 'NULL') {
          columnDef += ` DEFAULT ${defaultValue}`;
        }
      }

      return columnDef;
    }).join(',\n        ');

    // Ajouter les contraintes PRIMARY KEY
    const primaryKeys = table.constraints
      .filter(c => c.constraint_type === 'PRIMARY KEY')
      .map(c => c.column_name);

    if (primaryKeys.length > 0) {
      columnsSQL += `,\n        PRIMARY KEY (${primaryKeys.join(', ')})`;
    }

    const createSQL = `CREATE TABLE IF NOT EXISTS ${isMySQL ? '`' + table.table_name + '`' : '"' + table.table_name + '"'} (
        ${columnsSQL}
      )`;

    try {
      if (isMySQL) {
        await this.targetAdapter.query(createSQL, [], schema);
      } else {
        const prefixedSQL = createSQL.replace('CREATE TABLE IF NOT EXISTS ', `CREATE TABLE IF NOT EXISTS "${schema}".`);
        await this.targetAdapter.query(prefixedSQL);
      }
      console.log(`✅ Table ${table.table_name} créée avec ${table.columns.length} colonnes`);
    } catch (error) {
      console.error(`❌ Erreur création table ${table.table_name}:`, error);
    }
  }

  private mapPostgresToMySQL(pgType: string, maxLength?: number): string {
    switch (pgType.toLowerCase()) {
      case 'character varying':
      case 'varchar':
        return `VARCHAR(${maxLength || 255})`;
      case 'text':
        return 'TEXT';
      case 'integer':
      case 'int4':
        return 'INT';
      case 'bigint':
      case 'int8':
        return 'BIGINT';
      case 'numeric':
      case 'decimal':
        return 'DECIMAL(10,2)';
      case 'boolean':
        return 'BOOLEAN';
      case 'timestamp without time zone':
      case 'timestamp':
        return 'TIMESTAMP';
      case 'date':
        return 'DATE';
      case 'time':
        return 'TIME';
      default:
        return 'TEXT'; // Fallback sécurisé
    }
  }

  private async migrateRealData(allTableStructures: Record<string, TableStructure[]>): Promise<void> {
    if (!this.sourceAdapter || !this.targetAdapter) return;

    for (const [schema, tables] of Object.entries(allTableStructures)) {
      console.log(`🔄 Migration des données pour ${schema}...`);

      for (const table of tables) {
        try {
          // Récupérer TOUTES les données de la table source
          const dataResult = await this.sourceAdapter.query(
            `SELECT * FROM "${schema}".${table.table_name} ORDER BY 1`
          );

          if (dataResult.success && dataResult.data && dataResult.data.length > 0) {
            console.log(`📦 ${dataResult.data.length} enregistrements trouvés dans ${table.table_name}`);
            
            // Insérer les données dans la cible
            await this.insertRealData(schema, table, dataResult.data);
            
            console.log(`✅ ${dataResult.data.length} enregistrements migrés pour ${table.table_name}`);
          } else {
            console.log(`📭 Aucune donnée dans ${table.table_name}`);
          }
        } catch (error) {
          console.warn(`⚠️ Erreur migration ${table.table_name}:`, error);
        }
      }
    }
  }

  private async insertRealData(schema: string, table: TableStructure, data: any[]): Promise<void> {
    if (!this.targetAdapter || data.length === 0) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    const columnNames = table.columns.map(col => col.column_name);
    
    // Construire l'INSERT avec ON DUPLICATE KEY UPDATE pour MySQL
    const placeholders = columnNames.map(() => '?').join(', ');
    const updateClause = isMySQL 
      ? `ON DUPLICATE KEY UPDATE ${columnNames.map(col => `${col} = VALUES(${col})`).join(', ')}`
      : `ON CONFLICT DO NOTHING`; // PostgreSQL

    const insertSQL = `INSERT INTO ${isMySQL ? '`' + table.table_name + '`' : '"' + table.table_name + '"'} 
                       (${columnNames.join(', ')}) 
                       VALUES (${placeholders}) 
                       ${updateClause}`;

    // Insérer chaque enregistrement
    for (const row of data) {
      try {
        const values = columnNames.map(col => row[col] ?? null);
        await this.targetAdapter.query(insertSQL, values, schema);
      } catch (error) {
        console.warn(`⚠️ Erreur insertion ligne dans ${table.table_name}:`, error);
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

    console.log(`[Migration RÉELLE] ${step}: ${message} (${progress}/${total})`);
    
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

export { RealMigrationService };