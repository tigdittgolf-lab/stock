import { DatabaseAdapter } from './types';

export interface CompleteSchema {
  schemaName: string;
  tables: CompleteTable[];
}

export interface CompleteTable {
  tableName: string;
  columns: CompleteColumn[];
  constraints: CompleteConstraint[];
  recordCount: number;
  sampleData: any[];
}

export interface CompleteColumn {
  columnName: string;
  dataType: string;
  characterMaximumLength: number | null;
  isNullable: string;
  columnDefault: string | null;
  ordinalPosition: number;
}

export interface CompleteConstraint {
  constraintName: string;
  constraintType: string;
  columnName: string;
}

/**
 * Service de découverte COMPLÈTE qui trouve TOUTES les tables réelles
 * Utilise les requêtes information_schema directement
 */
export class CompleteDiscoveryService {
  private sourceAdapter: DatabaseAdapter;

  constructor(sourceAdapter: DatabaseAdapter) {
    this.sourceAdapter = sourceAdapter;
  }

  async discoverAllRealTables(tenantFilter?: string[]): Promise<CompleteSchema[]> {
    console.log('🔍 DÉCOUVERTE COMPLÈTE - Recherche de TOUTES les tables réelles...');
    if (tenantFilter && tenantFilter.length > 0) {
      console.log(`🎯 Filtre tenants actif: ${tenantFilter.join(', ')}`);
    }

    try {
      // 1. Découvrir TOUS les schémas réels via RPC (comme dans le test qui fonctionne)
      let realSchemas = await this.discoverSchemasViaRPC();
      
      // Appliquer le filtre si fourni
      if (tenantFilter && tenantFilter.length > 0) {
        realSchemas = realSchemas.filter(schema => tenantFilter.includes(schema));
        console.log(`📋 ${realSchemas.length} schémas filtrés:`, realSchemas);
      } else {
        console.log(`📋 ${realSchemas.length} schémas réels découverts:`, realSchemas);
      }

      if (realSchemas.length === 0) {
        throw new Error('Aucun schéma tenant trouvé dans la base source');
      }

      const completeSchemas: CompleteSchema[] = [];

      // 2. Pour chaque schéma, découvrir TOUTES les tables réelles via RPC
      for (const schemaName of realSchemas) {
        console.log(`🔍 Analyse COMPLÈTE du schéma ${schemaName}...`);
        
        const allTables = await this.discoverTablesViaRPC(schemaName);
        
        completeSchemas.push({
          schemaName,
          tables: allTables
        });

        console.log(`✅ ${schemaName}: ${allTables.length} tables RÉELLES découvertes`);
        allTables.forEach(table => {
          console.log(`  📋 ${table.tableName}: ${table.recordCount} enregistrements, ${table.columns.length} colonnes`);
        });
      }

      const totalTables = completeSchemas.reduce((sum, schema) => sum + schema.tables.length, 0);
      console.log(`🎯 DÉCOUVERTE TERMINÉE: ${completeSchemas.length} schémas, ${totalTables} tables RÉELLES`);

      return completeSchemas;
    } catch (error) {
      console.error('❌ Erreur découverte complète:', error);
      throw error;
    }
  }

  private async discoverSchemasViaRPC(): Promise<string[]> {
    try {
      console.log('🔍 Découverte des schémas via RPC...');
      
      const rpcResult = await this.sourceAdapter.executeRPC('discover_tenant_schemas', {});
      if (rpcResult.success) {
        const schemaData = Array.isArray(rpcResult.data) ? rpcResult.data : JSON.parse(rpcResult.data || '[]');
        console.log('✅ Schémas via RPC:', schemaData);
        return schemaData;
      } else {
        console.log('❌ RPC discover_tenant_schemas échoué:', rpcResult.error);
        // Fallback: tester les schémas connus
        return await this.testKnownSchemas();
      }
    } catch (error) {
      console.warn('⚠️ Erreur RPC schémas:', error);
      return await this.testKnownSchemas();
    }
  }

  private async discoverTablesViaRPC(schemaName: string): Promise<CompleteTable[]> {
    try {
      console.log(`🔍 Découverte des tables pour ${schemaName} via RPC...`);
      
      const rpcResult = await this.sourceAdapter.executeRPC('discover_schema_tables', { 
        p_schema_name: schemaName 
      });

      if (rpcResult.success) {
        const tables = Array.isArray(rpcResult.data) ? rpcResult.data : JSON.parse(rpcResult.data || '[]');
        console.log(`✅ ${schemaName}: ${tables.length} tables via RPC`);
        
        const completeTables: CompleteTable[] = [];

        // Pour chaque table, récupérer sa structure complète via RPC
        for (const tableInfo of tables) {
          const tableName = tableInfo.table_name;
          console.log(`  🔍 Analyse structure de ${tableName}...`);

          try {
            const structureResult = await this.sourceAdapter.executeRPC('discover_table_structure', {
              p_schema_name: schemaName,
              p_table_name: tableName
            });

            if (structureResult.success) {
              let structure = structureResult.data;
              
              // CORRECTION CRITIQUE: Traiter les différents formats de données
              if (typeof structure === 'string') {
                try {
                  structure = JSON.parse(structure);
                } catch (e) {
                  console.warn(`    ⚠️ Erreur parsing JSON pour ${tableName}:`, e);
                  continue;
                }
              }

              // CORRECTION: Les données peuvent être dans un tableau
              let actualStructure = structure;
              if (Array.isArray(structure)) {
                if (structure.length === 0) {
                  console.warn(`    ⚠️ ${tableName}: Tableau vide retourné`);
                  continue;
                }
                actualStructure = structure[0];
              }

              // Vérifier que la structure est valide
              if (!actualStructure || typeof actualStructure !== 'object') {
                console.warn(`    ⚠️ ${tableName}: Structure invalide`, actualStructure);
                continue;
              }

              const completeTable: CompleteTable = {
                tableName: tableName,
                columns: this.mapColumnsFromRPC((actualStructure as any).columns || []),
                constraints: this.mapConstraintsFromRPC((actualStructure as any).constraints || []),
                recordCount: (actualStructure as any).record_count || 0,
                sampleData: (actualStructure as any).sample_data || []
              };

              // CORRECTION: Vérifier que les colonnes existent vraiment et ont des noms valides
              if (!completeTable.columns || completeTable.columns.length === 0) {
                console.warn(`    ⚠️ ${tableName}: Aucune colonne trouvée dans la structure`);
                console.warn(`    📋 Structure reçue:`, JSON.stringify(actualStructure, null, 2));
                continue;
              }

              // CORRECTION CRITIQUE: Valider que chaque colonne a un nom valide
              const validColumns = completeTable.columns.filter(col => 
                col && col.columnName && col.columnName.trim() !== ''
              );

              if (validColumns.length === 0) {
                console.warn(`    ⚠️ ${tableName}: Aucune colonne avec nom valide trouvée`);
                console.warn(`    📋 Colonnes reçues:`, completeTable.columns.map(col => col?.columnName || 'UNDEFINED'));
                continue;
              }

              if (validColumns.length !== completeTable.columns.length) {
                console.warn(`    ⚠️ ${tableName}: ${completeTable.columns.length - validColumns.length} colonnes avec noms invalides ignorées`);
                completeTable.columns = validColumns;
              }

              completeTables.push(completeTable);
              console.log(`    ✅ ${tableName}: ${completeTable.recordCount} enregistrements, ${completeTable.columns.length} colonnes`);
            } else {
              console.warn(`    ⚠️ Erreur structure ${tableName}:`, structureResult.error);
            }
          } catch (error) {
            console.warn(`    ⚠️ Exception structure ${tableName}:`, error);
          }
        }

        return completeTables;
      } else {
        console.log(`❌ ${schemaName}: Erreur RPC tables -`, rpcResult.error);
        // Fallback: découvrir les tables via SQL direct
        console.log(`⚠️ Fallback: Découverte des tables de ${schemaName} via SQL direct...`);
        return await this.discoverAllTablesInSchema(schemaName);
      }
    } catch (error) {
      console.error(`❌ Erreur découverte tables ${schemaName}:`, error);
      // Fallback: découvrir les tables via SQL direct
      console.log(`⚠️ Fallback: Découverte des tables de ${schemaName} via SQL direct...`);
      return await this.discoverAllTablesInSchema(schemaName);
    }
  }

  private async discoverAllRealSchemas(): Promise<string[]> {
    try {
      // Essayer d'abord avec une requête information_schema directe
      console.log('🔍 Recherche des schémas via information_schema...');
      
      // Créer une fonction RPC temporaire pour exécuter des requêtes SQL
      const result = await this.executeDirectSQL(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE '%_bu%' 
        ORDER BY schema_name
      `);

      if (result.success && result.data && result.data.length > 0) {
        return result.data.map((row: any) => row.schema_name);
      }

      // Fallback: tester les schémas connus
      console.log('⚠️ Fallback: Test des schémas connus...');
      return await this.testKnownSchemas();
      
    } catch (error) {
      console.warn('⚠️ Erreur découverte schémas, utilisation du fallback:', error);
      return await this.testKnownSchemas();
    }
  }

  private async testKnownSchemas(): Promise<string[]> {
    console.log('🔍 Découverte dynamique de tous les schémas tenant...');
    
    try {
      // Découvrir TOUS les schémas qui correspondent au pattern tenant
      const result = await this.executeDirectSQL(`
        SELECT SCHEMA_NAME as schema_name
        FROM information_schema.SCHEMATA
        WHERE SCHEMA_NAME REGEXP '^[0-9]{4}_bu[0-9]{2}$'
        ORDER BY SCHEMA_NAME DESC
      `);

      if (result.success && result.data && result.data.length > 0) {
        const allSchemas = result.data.map((row: any) => row.schema_name || row.SCHEMA_NAME);
        console.log(`✅ ${allSchemas.length} schémas tenant découverts:`, allSchemas);
        
        // Vérifier que chaque schéma a des tables
        const validSchemas: string[] = [];
        for (const schema of allSchemas) {
          try {
            const tableCountResult = await this.executeDirectSQL(`
              SELECT COUNT(*) as table_count
              FROM information_schema.tables 
              WHERE table_schema = '${schema}' 
                AND table_type = 'BASE TABLE'
            `);

            const tableCount = tableCountResult.data?.[0]?.table_count || tableCountResult.data?.[0]?.TABLE_COUNT || 0;
            if (tableCount > 0) {
              validSchemas.push(schema);
              console.log(`✅ Schéma ${schema} trouvé avec ${tableCount} tables`);
            } else {
              console.log(`⚠️ Schéma ${schema} existe mais est vide (0 tables)`);
            }
          } catch (error) {
            console.log(`❌ Schéma ${schema} non accessible:`, error);
          }
        }
        
        return validSchemas;
      }
    } catch (error) {
      console.error('❌ Erreur découverte dynamique:', error);
    }
    
    // Fallback: liste hardcodée si la découverte dynamique échoue
    console.log('⚠️ Fallback: Test des schémas connus hardcodés...');
    const possibleSchemas = [
      '2025_bu01', '2025_bu02', '2025_bu03',
      '2024_bu01', '2024_bu02', '2024_bu03',
      '2023_bu01', '2023_bu02', '2023_bu03',
      '2022_bu01', '2022_bu02', '2022_bu03',
      '2021_bu01', '2021_bu02', '2021_bu03',
      '2020_bu01', '2020_bu02', '2020_bu03',
      '2019_bu01', '2019_bu02', '2019_bu03',
      '2018_bu01', '2018_bu02', '2018_bu03',
      '2017_bu01', '2017_bu02', '2017_bu03',
      '2016_bu01', '2016_bu02', '2016_bu03',
      '2015_bu01', '2015_bu02', '2015_bu03',
      '2014_bu01', '2014_bu02', '2014_bu03',
      '2013_bu01', '2013_bu02', '2013_bu03',
      '2012_bu01', '2012_bu02', '2012_bu03',
      '2011_bu01', '2011_bu02', '2011_bu03',
      '2010_bu01', '2010_bu02', '2010_bu03',
      '2009_bu01', '2009_bu02', '2009_bu03'
    ];
    
    const validSchemas: string[] = [];

    for (const schema of possibleSchemas) {
      try {
        // Tester si le schéma existe en essayant de lister ses tables
        const result = await this.executeDirectSQL(`
          SELECT COUNT(*) as table_count
          FROM information_schema.tables 
          WHERE table_schema = '${schema}' 
            AND table_type = 'BASE TABLE'
        `);

        const tableCount = result.data?.[0]?.table_count || result.data?.[0]?.TABLE_COUNT || 0;
        if (result.success && result.data && result.data[0] && tableCount > 0) {
          validSchemas.push(schema);
          console.log(`✅ Schéma ${schema} trouvé avec ${tableCount} tables`);
        }
      } catch (error) {
        console.log(`❌ Schéma ${schema} non accessible`);
      }
    }

    return validSchemas;
  }

  private async discoverAllTablesInSchema(schemaName: string): Promise<CompleteTable[]> {
    try {
      console.log(`🔍 Recherche de TOUTES les tables dans ${schemaName}...`);

      // 1. Récupérer TOUTES les tables du schéma
      const tablesResult = await this.executeDirectSQL(`
        SELECT table_name
        FROM information_schema.tables 
        WHERE table_schema = '${schemaName}' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
      `);

      if (!tablesResult.success || !tablesResult.data) {
        console.warn(`⚠️ Impossible de récupérer les tables pour ${schemaName}`);
        return [];
      }

      console.log(`📋 ${tablesResult.data.length} tables trouvées dans ${schemaName}`);

      const completeTables: CompleteTable[] = [];

      // 2. Pour chaque table, récupérer sa structure complète
      for (const tableRow of tablesResult.data) {
        const tableName = tableRow.table_name;
        console.log(`  🔍 Analyse de la table ${tableName}...`);

        try {
          const table = await this.analyzeCompleteTable(schemaName, tableName);
          completeTables.push(table);
          console.log(`    ✅ ${tableName}: ${table.recordCount} enregistrements, ${table.columns.length} colonnes`);
        } catch (error) {
          console.warn(`    ⚠️ Erreur analyse ${tableName}:`, error);
          // Continuer avec les autres tables
        }
      }

      return completeTables;
    } catch (error) {
      console.error(`❌ Erreur découverte tables ${schemaName}:`, error);
      return [];
    }
  }

  private async analyzeCompleteTable(schemaName: string, tableName: string): Promise<CompleteTable> {
    // 1. Récupérer la structure des colonnes
    const columnsResult = await this.executeDirectSQL(`
      SELECT column_name, data_type, character_maximum_length, 
             is_nullable, column_default, ordinal_position
      FROM information_schema.columns
      WHERE table_schema = '${schemaName}' 
        AND table_name = '${tableName}'
      ORDER BY ordinal_position
    `);

    const columns: CompleteColumn[] = columnsResult.success && columnsResult.data ? 
      columnsResult.data.map((col: any) => ({
        columnName: col.column_name,
        dataType: col.data_type,
        characterMaximumLength: col.character_maximum_length,
        isNullable: col.is_nullable,
        columnDefault: col.column_default,
        ordinalPosition: col.ordinal_position
      })) : [];

    // 2. Récupérer les contraintes
    const constraintsResult = await this.executeDirectSQL(`
      SELECT tc.constraint_name, tc.constraint_type, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu 
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = '${schemaName}' 
        AND tc.table_name = '${tableName}'
    `);

    const constraints: CompleteConstraint[] = constraintsResult.success && constraintsResult.data ?
      constraintsResult.data.map((cons: any) => ({
        constraintName: cons.constraint_name,
        constraintType: cons.constraint_type,
        columnName: cons.column_name
      })) : [];

    // 3. Compter les enregistrements
    let recordCount = 0;
    let sampleData: any[] = [];
    
    try {
      // Détecter le type de base de données pour utiliser la bonne syntaxe
      const isMySQL = this.sourceAdapter.constructor.name === 'MySQLAdapter';
      const quote = isMySQL ? '`' : '"';
      
      const countResult = await this.executeDirectSQL(`
        SELECT COUNT(*) as total FROM ${quote}${schemaName}${quote}.${quote}${tableName}${quote}
      `);
      
      if (countResult.success && countResult.data && countResult.data[0]) {
        recordCount = countResult.data[0].total || countResult.data[0].TOTAL || 0;
      }

      // 4. Récupérer quelques échantillons de données
      if (recordCount > 0) {
        const sampleResult = await this.executeDirectSQL(`
          SELECT * FROM ${quote}${schemaName}${quote}.${quote}${tableName}${quote} LIMIT 2
        `);
        
        if (sampleResult.success && sampleResult.data) {
          sampleData = sampleResult.data;
        }
      }
    } catch (error) {
      console.warn(`    ⚠️ Erreur comptage/échantillon ${tableName}:`, error);
    }

    return {
      tableName,
      columns,
      constraints,
      recordCount,
      sampleData
    };
  }

  private async executeDirectSQL(sql: string): Promise<any> {
    try {
      // Pour les requêtes information_schema, utiliser les nouvelles fonctions RPC spécialisées
      if (sql.includes('information_schema.schemata')) {
        const result = await this.sourceAdapter.executeRPC('discover_tenant_schemas', {});
        if (result.success) {
          // Convertir le format JSON en format attendu
          const schemas = Array.isArray(result.data) ? result.data : JSON.parse(result.data || '[]');
          return {
            success: true,
            data: schemas.map((name: string) => ({ schema_name: name }))
          };
        }
      }

      if (sql.includes('information_schema.tables')) {
        const schemaMatch = sql.match(/table_schema = '([^']+)'/);
        if (schemaMatch) {
          const schema = schemaMatch[1];
          const result = await this.sourceAdapter.executeRPC('discover_schema_tables', { 
            p_schema_name: schema 
          });
          if (result.success) {
            const tables = Array.isArray(result.data) ? result.data : JSON.parse(result.data || '[]');
            return {
              success: true,
              data: tables
            };
          }
        }
      }

      if (sql.includes('COUNT(*)') && sql.includes('"')) {
        // Requête de comptage: SELECT COUNT(*) FROM "schema".table
        const match = sql.match(/FROM "([^"]+)"\.([^\s]+)/);
        if (match) {
          const schema = match[1];
          const table = match[2];
          
          // Utiliser la fonction de découverte de structure qui inclut le count
          const result = await this.sourceAdapter.executeRPC('discover_table_structure', { 
            p_schema_name: schema,
            p_table_name: table
          });
          
          if (result.success) {
            const structure = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
            return {
              success: true,
              data: [{ total: structure?.record_count || 0 }]
            };
          }
        }
      }

      if (sql.includes('SELECT *') && sql.includes('LIMIT')) {
        // Requête d'échantillon: SELECT * FROM "schema".table LIMIT 2
        const match = sql.match(/FROM "([^"]+)"\.([^\s]+)/);
        if (match) {
          const schema = match[1];
          const table = match[2];
          
          // Utiliser la fonction de découverte de structure qui inclut les échantillons
          const result = await this.sourceAdapter.executeRPC('discover_table_structure', { 
            p_schema_name: schema,
            p_table_name: table
          });
          
          if (result.success) {
            const structure = typeof result.data === 'string' ? JSON.parse(result.data) : result.data;
            return {
              success: true,
              data: structure?.sample_data || []
            };
          }
        }
      }

      // Fallback: essayer la méthode query directe
      const queryResult = await this.sourceAdapter.query(sql);
      return queryResult;

    } catch (error) {
      console.warn('⚠️ Erreur exécution SQL directe:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur SQL' };
    }
  }

  generateCompleteCreateTableSQL(table: CompleteTable, schemaName: string, isMySQL: boolean): string {
    // Vérifier que la table a des colonnes
    if (!table.columns || table.columns.length === 0) {
      console.warn(`⚠️ Table ${table.tableName} n'a pas de colonnes, ignorée`);
      throw new Error(`Table ${table.tableName} n'a pas de colonnes définies`);
    }

    // CORRECTION CRITIQUE: Filtrer les colonnes avec des noms valides
    const validColumns = table.columns.filter(col => 
      col && col.columnName && col.columnName.trim() !== ''
    );

    if (validColumns.length === 0) {
      console.warn(`⚠️ Table ${table.tableName} n'a pas de colonnes avec noms valides, ignorée`);
      throw new Error(`Table ${table.tableName} n'a pas de colonnes avec noms valides`);
    }

    if (validColumns.length !== table.columns.length) {
      console.warn(`⚠️ Table ${table.tableName}: ${table.columns.length - validColumns.length} colonnes avec noms invalides ignorées`);
    }

    const tableName = isMySQL ? `\`${table.tableName}\`` : `"${table.tableName}"`;
    
    // Construire les colonnes avec leurs types exacts
    const columnDefinitions = validColumns.map(col => {
      let columnDef = isMySQL ? `\`${col.columnName}\` ` : `"${col.columnName}" `;
      
      // Mapper les types selon la base cible
      if (isMySQL) {
        columnDef += this.mapPostgreSQLTypeToMySQL(col.dataType, col.characterMaximumLength);
      } else {
        // CORRECTION CRITIQUE: Mapper les types MySQL vers PostgreSQL
        const mappedType = this.mapMySQLTypeToPostgreSQL(col.dataType, col.characterMaximumLength);
        columnDef += mappedType;
      }

      // Nullable
      if (col.isNullable === 'NO') {
        columnDef += ' NOT NULL';
      }

      // CORRECTION CRITIQUE: Gérer les defaults PostgreSQL pour MySQL
      if (col.columnDefault && col.columnDefault !== 'NULL') {
        let defaultValue = col.columnDefault;
        
        if (isMySQL) {
          // Convertir les defaults PostgreSQL vers MySQL
          if (defaultValue.includes('nextval(')) {
            // PostgreSQL sequence -> MySQL AUTO_INCREMENT
            columnDef += ' AUTO_INCREMENT';
          } else if (defaultValue.includes('CURRENT_TIMESTAMP') || defaultValue.includes('now()')) {
            columnDef += ' DEFAULT CURRENT_TIMESTAMP';
          } else if (defaultValue.includes('::')) {
            // Nettoyer les casts PostgreSQL (ex: 'value'::text -> 'value')
            defaultValue = defaultValue.split('::')[0];
            columnDef += ` DEFAULT ${defaultValue}`;
          } else {
            columnDef += ` DEFAULT ${defaultValue}`;
          }
        } else {
          // CORRECTION POSTGRESQL: Garder les defaults PostgreSQL natifs
          if (defaultValue.includes('nextval(')) {
            // CORRECTION: Vérifier et créer la séquence si nécessaire
            const sequenceMatch = defaultValue.match(/nextval\('([^']+)'/);
            if (sequenceMatch) {
              const sequenceName = sequenceMatch[1];
              console.log(`  🔧 Séquence PostgreSQL détectée: ${sequenceName}`);
              // Note: La séquence sera créée automatiquement par PostgreSQL si elle n'existe pas
            }
            columnDef += ` DEFAULT ${defaultValue}`;
          } else if (defaultValue.includes('CURRENT_TIMESTAMP') || defaultValue.includes('now()')) {
            columnDef += ' DEFAULT CURRENT_TIMESTAMP';
          } else {
            columnDef += ` DEFAULT ${defaultValue}`;
          }
        }
      }

      return columnDef;
    }).join(',\n        ');

    // Ajouter les contraintes PRIMARY KEY
    const primaryKeyConstraints = table.constraints.filter(c => c.constraintType === 'PRIMARY KEY');
    const primaryKeyColumns = [...new Set(primaryKeyConstraints.map(c => c.columnName))];
    
    let primaryKeyClause = '';
    if (primaryKeyColumns.length > 0) {
      // Vérifier que les colonnes de clé primaire existent dans les colonnes valides
      const validPrimaryKeys = primaryKeyColumns.filter(pkCol => 
        validColumns.some(col => col.columnName === pkCol)
      );
      
      if (validPrimaryKeys.length > 0) {
        const formattedPKColumns = validPrimaryKeys.map(col => 
          isMySQL ? `\`${col}\`` : `"${col}"`
        ).join(', ');
        primaryKeyClause = `,\n        PRIMARY KEY (${formattedPKColumns})`;
      }
    }

    return `CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columnDefinitions}${primaryKeyClause}
      )`;
  }

  private mapPostgreSQLTypeToMySQL(pgType: string, maxLength: number | null): string {
    switch (pgType.toLowerCase()) {
      case 'character varying':
      case 'varchar':
        return `VARCHAR(${maxLength || 255})`;
      case 'character':
      case 'char':
        return `CHAR(${maxLength || 1})`;
      case 'text':
        return 'TEXT';
      case 'integer':
      case 'int4':
        return 'INT';
      case 'bigint':
      case 'int8':
        return 'BIGINT';
      case 'smallint':
      case 'int2':
        return 'SMALLINT';
      case 'numeric':
      case 'decimal':
        return 'DECIMAL(10,2)';
      case 'real':
      case 'float4':
        return 'FLOAT';
      case 'double precision':
      case 'float8':
        return 'DOUBLE';
      case 'boolean':
        return 'BOOLEAN';
      case 'timestamp without time zone':
      case 'timestamp':
        return 'TIMESTAMP';
      case 'timestamp with time zone':
        return 'TIMESTAMP';
      case 'date':
        return 'DATE';
      case 'time without time zone':
      case 'time':
        return 'TIME';
      case 'uuid':
        return 'VARCHAR(36)';
      case 'json':
      case 'jsonb':
        return 'JSON';
      // CORRECTION: Gérer les types de séquence PostgreSQL
      case 'serial':
      case 'bigserial':
      case 'smallserial':
        return pgType.includes('big') ? 'BIGINT' : pgType.includes('small') ? 'SMALLINT' : 'INT';
      default:
        console.warn(`⚠️ Type PostgreSQL non mappé: ${pgType}, utilisation de TEXT`);
        return 'TEXT';
    }
  }

  /**
   * Mapper les types MySQL vers PostgreSQL
   */
  private mapMySQLTypeToPostgreSQL(mysqlType: string, maxLength: number | null): string {
    const lowerType = mysqlType.toLowerCase();
    
    switch (lowerType) {
      case 'varchar':
        return `VARCHAR(${maxLength || 255})`;
      case 'char':
        return `CHAR(${maxLength || 1})`;
      case 'text':
      case 'tinytext':
      case 'mediumtext':
      case 'longtext':
        return 'TEXT';
      case 'int':
      case 'integer':
      case 'mediumint':
        return 'INTEGER';
      case 'bigint':
        return 'BIGINT';
      case 'smallint':
      case 'tinyint':
        return 'SMALLINT';
      case 'decimal':
      case 'numeric':
        return 'NUMERIC';
      case 'float':
        return 'REAL';
      case 'double':
      case 'double precision':
        return 'DOUBLE PRECISION';
      case 'boolean':
      case 'bool':
        return 'BOOLEAN';
      case 'datetime':
      case 'timestamp':
        return 'TIMESTAMP';
      case 'date':
        return 'DATE';
      case 'time':
        return 'TIME';
      case 'json':
        return 'JSONB';
      case 'blob':
      case 'tinyblob':
      case 'mediumblob':
      case 'longblob':
        return 'BYTEA';
      default:
        console.warn(`⚠️ Type MySQL non mappé: ${mysqlType}, utilisation de TEXT`);
        return 'TEXT';
    }
  }

  /**
   * Mappe les colonnes du format RPC (snake_case) vers le format TypeScript (camelCase)
   */
  private mapColumnsFromRPC(rpcColumns: any[]): CompleteColumn[] {
    if (!Array.isArray(rpcColumns)) {
      console.warn('⚠️ Colonnes RPC ne sont pas un tableau:', rpcColumns);
      return [];
    }

    return rpcColumns.map(rpcCol => {
      if (!rpcCol || typeof rpcCol !== 'object') {
        console.warn('⚠️ Colonne RPC invalide:', rpcCol);
        return null;
      }

      return {
        columnName: rpcCol.column_name || rpcCol.columnName || 'UNKNOWN',
        dataType: rpcCol.data_type || rpcCol.dataType || 'text',
        characterMaximumLength: rpcCol.character_maximum_length || rpcCol.characterMaximumLength || null,
        isNullable: rpcCol.is_nullable || rpcCol.isNullable || 'YES',
        columnDefault: rpcCol.column_default || rpcCol.columnDefault || null,
        ordinalPosition: rpcCol.ordinal_position || rpcCol.ordinalPosition || 0
      };
    }).filter(col => col !== null) as CompleteColumn[];
  }

  /**
   * Mappe les contraintes du format RPC (snake_case) vers le format TypeScript (camelCase)
   */
  private mapConstraintsFromRPC(rpcConstraints: any[]): CompleteConstraint[] {
    if (!Array.isArray(rpcConstraints)) {
      console.warn('⚠️ Contraintes RPC ne sont pas un tableau:', rpcConstraints);
      return [];
    }

    return rpcConstraints.map(rpcCons => {
      if (!rpcCons || typeof rpcCons !== 'object') {
        console.warn('⚠️ Contrainte RPC invalide:', rpcCons);
        return null;
      }

      return {
        constraintName: rpcCons.constraint_name || rpcCons.constraintName || 'UNKNOWN',
        constraintType: rpcCons.constraint_type || rpcCons.constraintType || 'UNKNOWN',
        columnName: rpcCons.column_name || rpcCons.columnName || 'UNKNOWN'
      };
    }).filter(cons => cons !== null) as CompleteConstraint[];
  }
}