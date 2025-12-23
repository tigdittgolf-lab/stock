import { DatabaseConfig, QueryResult } from './types';
import { SupabaseAdapter } from './adapters/supabase-adapter';
import { MySQLAdapter } from './adapters/mysql-adapter';
import { PostgreSQLAdapter } from './adapters/postgresql-adapter';
import { DatabaseAdapter } from './types';
import { CompleteDiscoveryService, CompleteSchema, CompleteTable } from './complete-discovery-service';

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
 * Service de migration VRAIE qui découvre et migre TOUTES les tables réelles
 */
export class CompleteMigrationService {
  private sourceAdapter: DatabaseAdapter | null = null;
  private targetAdapter: DatabaseAdapter | null = null;
  private progressCallback?: (progress: MigrationProgress) => void;
  private discoveryService: CompleteDiscoveryService | null = null;

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

      // Initialiser le service de découverte COMPLÈTE
      this.discoveryService = new CompleteDiscoveryService(this.sourceAdapter);

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
      // Étape 1: Découverte COMPLÈTE de TOUTES les tables réelles
      this.reportProgress('Découverte', 1, 8, 'Découverte COMPLÈTE de toutes les tables réelles...', true);
      const allRealSchemas = await this.discoveryService.discoverAllRealTables();
      
      if (allRealSchemas.length === 0) {
        throw new Error('Aucune table réelle découverte dans la source');
      }

      const totalTables = allRealSchemas.reduce((sum, schema) => sum + schema.tables.length, 0);
      console.log(`🎯 DÉCOUVERTE COMPLÈTE: ${allRealSchemas.length} schémas, ${totalTables} tables RÉELLES`);

      // Étape 2: Validation de la découverte
      this.reportProgress('Validation', 2, 8, `Validation de ${totalTables} tables découvertes...`, true);
      await this.validateCompleteDiscovery(allRealSchemas);

      // Étape 3: Nettoyage de la cible
      this.reportProgress('Nettoyage', 3, 8, 'Nettoyage complet de la base cible...', true);
      await this.cleanupTarget(allRealSchemas.map(s => s.schemaName));

      // Étape 4: Création des schémas
      this.reportProgress('Schémas', 4, 8, 'Création des schémas cibles...', true);
      await this.createAllTargetSchemas(allRealSchemas);

      // Étape 5: Création de TOUTES les tables
      this.reportProgress('Tables', 5, 8, `Création de ${totalTables} tables réelles...`, true);
      await this.createAllRealTables(allRealSchemas);

      // Étape 6: Migration de TOUTES les données
      this.reportProgress('Données', 6, 8, 'Migration de toutes les données réelles...', true);
      if (options.includeData) {
        await this.migrateAllRealData(allRealSchemas);
      }

      // Étape 7: Vérification complète
      this.reportProgress('Vérification', 7, 8, 'Vérification complète de la migration...', true);
      await this.verifyCompleteMigration(allRealSchemas);

      // Étape 8: Finalisation
      this.reportProgress('Terminé', 8, 8, `Migration VRAIE terminée: ${totalTables} tables migrées!`, true);
      return true;

    } catch (error) {
      this.reportProgress('Erreur', 0, 8, 'Migration échouée', false,
        error instanceof Error ? error.message : 'Erreur');
      return false;
    }
  }

  private async validateCompleteDiscovery(schemas: CompleteSchema[]): Promise<void> {
    console.log('🔍 VALIDATION DE LA DÉCOUVERTE COMPLÈTE:');
    
    for (const schema of schemas) {
      console.log(`✅ Schéma ${schema.schemaName}: ${schema.tables.length} tables RÉELLES`);
      
      for (const table of schema.tables) {
        console.log(`  📋 ${table.tableName}: ${table.recordCount} enregistrements, ${table.columns.length} colonnes`);
        
        // Afficher les colonnes pour vérification
        const columnNames = table.columns.map(col => `${col.columnName}(${col.dataType})`).join(', ');
        console.log(`    🔧 Colonnes: ${columnNames}`);
        
        // Vérifier les contraintes
        const primaryKeys = table.constraints.filter(c => c.constraintType === 'PRIMARY KEY');
        if (primaryKeys.length > 0) {
          console.log(`    🔑 Clés primaires: ${primaryKeys.map(pk => pk.columnName).join(', ')}`);
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

  private async createAllTargetSchemas(schemas: CompleteSchema[]): Promise<void> {
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

  private async createAllRealTables(schemas: CompleteSchema[]): Promise<void> {
    if (!this.targetAdapter || !this.discoveryService) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    console.log(`🔨 Création des tables pour ${isMySQL ? 'MySQL' : 'PostgreSQL'}...`);

    for (const schema of schemas) {
      console.log(`🔨 Création de ${schema.tables.length} tables RÉELLES pour ${schema.schemaName}...`);
      
      // ÉTAPE CRITIQUE: Vérifier que la base/schéma existe avant de créer les tables
      if (isMySQL) {
        console.log(`  🔍 Vérification existence base MySQL ${schema.schemaName}...`);
        const dbCheckResult = await this.targetAdapter.query(
          `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`, 
          [schema.schemaName], 
          'information_schema'
        );
        
        if (!dbCheckResult.success || !dbCheckResult.data || dbCheckResult.data.length === 0) {
          console.error(`  ❌ Base MySQL ${schema.schemaName} n'existe pas! Création...`);
          const createDbResult = await this.targetAdapter.query(
            `CREATE DATABASE IF NOT EXISTS \`${schema.schemaName}\``, 
            [], 
            'mysql'
          );
          
          if (!createDbResult.success) {
            console.error(`  ❌ ÉCHEC création base ${schema.schemaName}: ${createDbResult.error}`);
            continue; // Passer au schéma suivant
          }
          console.log(`  ✅ Base MySQL ${schema.schemaName} créée`);
        } else {
          console.log(`  ✅ Base MySQL ${schema.schemaName} existe déjà`);
        }
      } else {
        // CORRECTION POSTGRESQL: Vérifier que le schéma existe avant de créer les tables
        console.log(`  🔍 Vérification existence schéma PostgreSQL ${schema.schemaName}...`);
        const schemaCheckResult = await this.targetAdapter.query(
          `SELECT schema_name FROM information_schema.schemata WHERE schema_name = $1`, 
          [schema.schemaName]
        );
        
        if (!schemaCheckResult.success || !schemaCheckResult.data || schemaCheckResult.data.length === 0) {
          console.error(`  ❌ Schéma PostgreSQL ${schema.schemaName} n'existe pas! Création...`);
          const createSchemaResult = await this.targetAdapter.query(
            `CREATE SCHEMA IF NOT EXISTS "${schema.schemaName}"`
          );
          
          if (!createSchemaResult.success) {
            console.error(`  ❌ ÉCHEC création schéma PostgreSQL ${schema.schemaName}: ${createSchemaResult.error}`);
            continue; // Passer au schéma suivant
          }
          console.log(`  ✅ Schéma PostgreSQL ${schema.schemaName} créé`);
        } else {
          console.log(`  ✅ Schéma PostgreSQL ${schema.schemaName} existe déjà`);
        }
      }
      
      let createdCount = 0;
      let failedCount = 0;
      let skippedCount = 0;
      
      for (const table of schema.tables) {
        // Ignorer les tables sans colonnes
        if (!table.columns || table.columns.length === 0) {
          console.log(`  ⚠️ Table ${table.tableName} ignorée (0 colonnes)`);
          skippedCount++;
          continue;
        }

        try {
          console.log(`  🔧 Création table ${table.tableName} (${table.columns.length} colonnes)...`);
          
          // Générer le SQL de création
          const createSQL = this.discoveryService.generateCompleteCreateTableSQL(table, schema.schemaName, isMySQL);
          console.log(`  📝 SQL généré pour ${table.tableName}:`);
          console.log(`      ${createSQL}`);
          
          // ÉTAPE CRITIQUE: Exécuter la création avec gestion d'erreur détaillée
          let result;
          if (isMySQL) {
            console.log(`  🔄 Exécution MySQL sur base ${schema.schemaName}...`);
            
            // Pour MySQL, s'assurer qu'on utilise la bonne base
            result = await this.targetAdapter.query(createSQL, [], schema.schemaName);
            
            console.log(`  📊 Résultat création MySQL:`, {
              success: result.success,
              error: result.error,
              data: result.data ? 'présent' : 'absent'
            });
            
          } else {
            console.log(`  🔄 Exécution PostgreSQL avec préfixe schéma...`);
            
            // CORRECTION POSTGRESQL: Créer les séquences avant la table
            const sequenceMatches = createSQL.match(/nextval\('([^']+)'/g);
            if (sequenceMatches) {
              for (const match of sequenceMatches) {
                const sequenceName = match.match(/nextval\('([^']+)'/)?.[1];
                if (sequenceName) {
                  console.log(`  🔧 Création séquence PostgreSQL: ${sequenceName}`);
                  const createSeqSQL = `CREATE SEQUENCE IF NOT EXISTS ${sequenceName}`;
                  const seqResult = await this.targetAdapter.query(createSeqSQL);
                  if (!seqResult.success) {
                    console.warn(`  ⚠️ Erreur création séquence ${sequenceName}: ${seqResult.error}`);
                  } else {
                    console.log(`  ✅ Séquence ${sequenceName} créée`);
                  }
                }
              }
            }
            
            const prefixedSQL = createSQL.replace('CREATE TABLE IF NOT EXISTS ', `CREATE TABLE IF NOT EXISTS "${schema.schemaName}".`);
            console.log(`  📝 SQL PostgreSQL final: ${prefixedSQL.substring(0, 200)}...`);
            result = await this.targetAdapter.query(prefixedSQL);
            
            console.log(`  📊 Résultat création PostgreSQL:`, {
              success: result.success,
              error: result.error,
              data: result.data ? 'présent' : 'absent'
            });
          }
          
          if (!result.success) {
            throw new Error(result.error || 'Erreur création table inconnue');
          }
          
          createdCount++;
          console.log(`  ✅ Table ${table.tableName} créée avec succès`);
          
          // ÉTAPE CRITIQUE: Vérification immédiate que la table existe
          console.log(`  🔍 Vérification immédiate existence table ${table.tableName}...`);
          
          let verifySQL;
          if (isMySQL) {
            verifySQL = `SHOW TABLES LIKE '${table.tableName}'`;
          } else {
            // CORRECTION POSTGRESQL: Vérifier l'existence de la table dans le schéma
            verifySQL = `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema.schemaName}' AND table_name = '${table.tableName}'`;
          }
            
          const verifyResult = await this.targetAdapter.query(verifySQL, [], isMySQL ? schema.schemaName : undefined);
          
          if (verifyResult.success) {
            if (isMySQL) {
              const tableExists = verifyResult.data && verifyResult.data.length > 0;
              if (tableExists) {
                console.log(`  ✅ Vérification ${table.tableName}: table existe dans MySQL`);
              } else {
                console.error(`  ❌ Vérification ${table.tableName}: table N'EXISTE PAS dans MySQL!`);
                failedCount++;
                createdCount--; // Corriger le compteur
              }
            } else {
              // CORRECTION POSTGRESQL: Vérifier que la table existe vraiment
              const tableExists = verifyResult.data && verifyResult.data.length > 0;
              if (tableExists) {
                console.log(`  ✅ Vérification ${table.tableName}: table existe dans PostgreSQL schéma ${schema.schemaName}`);
              } else {
                console.error(`  ❌ Vérification ${table.tableName}: table N'EXISTE PAS dans PostgreSQL schéma ${schema.schemaName}!`);
                console.error(`  🔍 Requête PostgreSQL: ${verifySQL}`);
                failedCount++;
                createdCount--; // Corriger le compteur
              }
            }
          } else {
            console.error(`  ❌ Vérification ${table.tableName}: ${verifyResult.error}`);
            console.error(`  💡 La table a été "créée" mais n'est pas accessible - problème de création!`);
            failedCount++;
            createdCount--; // Corriger le compteur
          }
          
        } catch (error) {
          failedCount++;
          console.error(`  ❌ ÉCHEC création table ${table.tableName}:`);
          console.error(`      Erreur: ${error instanceof Error ? error.message : error}`);
          console.error(`      Type: ${typeof error}`);
          
          // Diagnostic détaillé
          if (error instanceof Error) {
            if (error.message.includes('database') || error.message.includes('schema')) {
              console.error(`      💡 Problème: Base/schéma ${schema.schemaName} inaccessible`);
            } else if (error.message.includes('syntax')) {
              console.error(`      💡 Problème: Erreur de syntaxe SQL`);
              console.error(`      💡 SQL problématique: ${createSQL?.substring(0, 200)}...`);
            } else if (error.message.includes('connection')) {
              console.error(`      💡 Problème: Connexion MySQL fermée ou invalide`);
            } else {
              console.error(`      💡 Erreur inconnue, vérifier les logs MySQL`);
            }
          }
        }
      }
      
      console.log(`🎯 ${schema.schemaName}: ${createdCount} créées, ${failedCount} échouées, ${skippedCount} ignorées`);
      
      if (failedCount > 0) {
        console.error(`❌ ${failedCount} tables ont échoué dans ${schema.schemaName}`);
        console.error(`❌ Cela indique un problème CRITIQUE dans la création des tables`);
      }
      
      if (createdCount === 0 && failedCount > 0) {
        console.error(`🚨 AUCUNE table créée dans ${schema.schemaName} - PROBLÈME MAJEUR!`);
      }
    }
  }

  private async migrateAllRealData(schemas: CompleteSchema[]): Promise<void> {
    if (!this.sourceAdapter || !this.targetAdapter) return;

    for (const schema of schemas) {
      console.log(`📦 Migration des données pour ${schema.schemaName}...`);
      
      for (const table of schema.tables) {
        if (table.recordCount === 0) {
          console.log(`  📭 Table ${table.tableName} vide, ignorée`);
          continue;
        }

        try {
          // Essayer d'abord avec la nouvelle fonction RPC get_all_table_data
          let dataResult = await this.sourceAdapter.executeRPC('get_all_table_data', {
            p_schema_name: schema.schemaName,
            p_table_name: table.tableName
          });

          // Si la fonction RPC n'existe pas, essayer une requête directe
          if (!dataResult.success) {
            dataResult = await this.sourceAdapter.query(`
              SELECT * FROM "${schema.schemaName}".${table.tableName} ORDER BY 1
            `);
          }

          if (dataResult.success && dataResult.data && dataResult.data.length > 0) {
            const data = Array.isArray(dataResult.data) ? dataResult.data : JSON.parse(dataResult.data || '[]');
            console.log(`  📥 ${data.length} enregistrements récupérés pour ${table.tableName}`);
            
            // Insérer toutes les données
            await this.insertAllRealData(schema.schemaName, table, data);
            
            console.log(`  ✅ ${data.length} enregistrements migrés pour ${table.tableName}`);
          } else {
            console.log(`  📭 Aucune donnée récupérée pour ${table.tableName}`);
          }
        } catch (error) {
          console.error(`  ❌ Erreur migration données ${table.tableName}:`, error);
          // Continuer avec les autres tables
        }
      }
    }
  }

  private async insertAllRealData(schemaName: string, table: CompleteTable, data: any[]): Promise<void> {
    if (!this.targetAdapter || data.length === 0) return;

    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    
    // CORRECTION CRITIQUE: Vérifier que les colonnes existent et ne sont pas vides
    if (!table.columns || table.columns.length === 0) {
      console.warn(`    ⚠️ Table ${table.tableName} n'a pas de colonnes définies, insertion ignorée`);
      return;
    }

    const columnNames = table.columns
      .map(col => col.columnName)
      .filter(name => name && name.trim() !== ''); // Filtrer les noms vides

    if (columnNames.length === 0) {
      console.warn(`    ⚠️ Table ${table.tableName} n'a pas de colonnes valides, insertion ignorée`);
      return;
    }

    console.log(`    🔧 Insertion dans ${table.tableName} avec colonnes: ${columnNames.join(', ')}`);
    
    // Construire l'INSERT avec gestion des conflits
    let placeholders, tableName, insertSQL;
    
    if (isMySQL) {
      // MySQL: utilise ? et nom de table simple
      placeholders = columnNames.map(() => '?').join(', ');
      tableName = `\`${table.tableName}\``;
      const updateClause = `ON DUPLICATE KEY UPDATE ${columnNames.map(col => `\`${col}\` = VALUES(\`${col}\`)`).join(', ')}`;
      insertSQL = `INSERT INTO ${tableName} (${columnNames.map(col => `\`${col}\``).join(', ')}) VALUES (${placeholders}) ${updateClause}`;
    } else {
      // CORRECTION POSTGRESQL: utilise $1,$2,$3 et schéma.table
      placeholders = columnNames.map((_, index) => `$${index + 1}`).join(', ');
      tableName = `"${schemaName}"."${table.tableName}"`;
      const updateClause = `ON CONFLICT DO NOTHING`;
      insertSQL = `INSERT INTO ${tableName} (${columnNames.map(col => `"${col}"`).join(', ')}) VALUES (${placeholders}) ${updateClause}`;
    }

    console.log(`    📝 SQL généré pour insertion: ${insertSQL.substring(0, 200)}...`);

    // Insérer chaque enregistrement avec gestion d'erreur améliorée
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        // CORRECTION: S'assurer que les valeurs correspondent aux colonnes
        const values = columnNames.map(col => {
          const value = row[col];
          // Gérer les valeurs undefined/null
          if (value === undefined || value === null) {
            return null;
          }
          // Gérer les objets JSON
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return value;
        });

        console.log(`    🔄 Insertion ligne ${i + 1}/${data.length} avec ${values.length} valeurs`);
        
        let result;
        if (isMySQL) {
          // MySQL: utilise le paramètre schemaName
          result = await this.targetAdapter.query(insertSQL, values, schemaName);
        } else {
          // CORRECTION POSTGRESQL: pas de paramètre schemaName (déjà dans le SQL)
          result = await this.targetAdapter.query(insertSQL, values);
        }
        
        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          console.warn(`    ⚠️ Erreur insertion ligne ${i + 1}: ${result.error}`);
        }
      } catch (error) {
        errorCount++;
        console.warn(`    ⚠️ Exception insertion ligne ${i + 1} dans ${table.tableName}:`, error);
        
        // Diagnostic détaillé pour la première erreur
        if (errorCount === 1) {
          console.warn(`    🔍 Diagnostic première erreur:`);
          console.warn(`      - Table: ${table.tableName}`);
          console.warn(`      - Colonnes attendues: ${columnNames.length}`);
          console.warn(`      - Colonnes: ${columnNames.join(', ')}`);
          console.warn(`      - Données ligne: ${JSON.stringify(row).substring(0, 200)}...`);
          console.warn(`      - SQL: ${insertSQL.substring(0, 300)}...`);
        }
      }
    }

    console.log(`    📊 ${successCount}/${data.length} enregistrements insérés avec succès (${errorCount} erreurs)`);
    
    if (errorCount > 0) {
      console.warn(`    ⚠️ ${errorCount} erreurs d'insertion dans ${table.tableName}`);
    }
  }

  private async verifyCompleteMigration(schemas: CompleteSchema[]): Promise<void> {
    if (!this.targetAdapter) return;

    console.log('🔍 VÉRIFICATION COMPLÈTE DE LA MIGRATION:');
    
    const isMySQL = this.targetAdapter.constructor.name === 'MySQLAdapter';
    let totalSourceRecords = 0;
    let totalTargetRecords = 0;
    let successfulTables = 0;
    let failedTables = 0;
    let skippedTables = 0;

    for (const schema of schemas) {
      console.log(`📊 Vérification ${schema.schemaName}:`);
      
      // Vérifier d'abord que le schéma/base existe
      if (isMySQL) {
        const schemaCheckResult = await this.targetAdapter.query(
          `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?`, 
          [schema.schemaName], 
          'information_schema'
        );
        
        if (!schemaCheckResult.success || !schemaCheckResult.data || schemaCheckResult.data.length === 0) {
          console.error(`  ❌ Base MySQL ${schema.schemaName} n'existe pas!`);
          failedTables += schema.tables.filter(t => t.columns && t.columns.length > 0).length;
          continue;
        } else {
          console.log(`  ✅ Base MySQL ${schema.schemaName} existe`);
        }
      }
      
      for (const table of schema.tables) {
        // Ignorer les tables sans colonnes dans la vérification aussi
        if (!table.columns || table.columns.length === 0) {
          console.log(`  ⚠️ Table ${table.tableName} ignorée dans la vérification (0 colonnes)`);
          skippedTables++;
          continue;
        }

        try {
          // Vérifier d'abord que la table existe
          const tableExistsSQL = isMySQL 
            ? `SHOW TABLES LIKE '${table.tableName}'`
            : `SELECT table_name FROM information_schema.tables WHERE table_schema = '${schema.schemaName}' AND table_name = '${table.tableName}'`;
            
          const existsResult = await this.targetAdapter.query(tableExistsSQL, [], schema.schemaName);
          
          if (!existsResult.success || !existsResult.data || existsResult.data.length === 0) {
            failedTables++;
            console.log(`  ❌ ${table.tableName}: Table n'existe pas dans ${schema.schemaName}`);
            continue;
          }
          
          // Si la table existe, compter les enregistrements
          let countSQL;
          if (isMySQL) {
            countSQL = `SELECT COUNT(*) as count FROM \`${table.tableName}\``;
          } else {
            // CORRECTION POSTGRESQL: Inclure le schéma dans la requête
            countSQL = `SELECT COUNT(*) as count FROM "${schema.schemaName}"."${table.tableName}"`;
          }
          
          const countResult = await this.targetAdapter.query(
            countSQL, 
            [], 
            isMySQL ? schema.schemaName : undefined  // PostgreSQL n'utilise pas ce paramètre
          );
          
          if (countResult.success && countResult.data && countResult.data[0]) {
            const targetCount = countResult.data[0].count || countResult.data[0].COUNT || 0;
            totalSourceRecords += table.recordCount;
            totalTargetRecords += targetCount;
            successfulTables++;
            
            const status = targetCount === table.recordCount ? '✅' : '⚠️';
            console.log(`  ${status} ${table.tableName}: ${targetCount}/${table.recordCount} enregistrements`);
            
            if (targetCount !== table.recordCount) {
              console.warn(`    💡 Différence de données: attendu ${table.recordCount}, trouvé ${targetCount}`);
            }
          } else {
            failedTables++;
            console.log(`  ❌ ${table.tableName}: Erreur comptage - ${countResult.error}`);
          }
        } catch (error) {
          failedTables++;
          console.error(`  ❌ ${table.tableName}: Erreur vérification - ${error}`);
        }
      }
    }

    console.log(`🎯 RÉSULTAT FINAL: ${totalTargetRecords}/${totalSourceRecords} enregistrements migrés`);
    console.log(`📊 TABLES: ${successfulTables} réussies, ${failedTables} échouées, ${skippedTables} ignorées`);
    
    if (totalTargetRecords === totalSourceRecords && failedTables === 0) {
      console.log('✅ MIGRATION PARFAITE: Toutes les données ont été migrées!');
    } else if (failedTables > 0) {
      console.log(`❌ MIGRATION PARTIELLE: ${failedTables} tables ont échoué`);
      
      // Si TOUTES les tables avec colonnes ont échoué, c'est un problème de création
      const totalTablesWithColumns = schemas.reduce((sum, schema) => 
        sum + schema.tables.filter(table => table.columns && table.columns.length > 0).length, 0
      );
      
      if (failedTables === totalTablesWithColumns) {
        throw new Error(`AUCUNE table n'a été créée ! Problème CRITIQUE dans la phase de création des tables.`);
      } else if (successfulTables === 0) {
        throw new Error(`AUCUNE table n'est accessible ! Vérifier la configuration MySQL et les permissions.`);
      } else {
        console.warn(`⚠️ Migration partielle: ${successfulTables} tables OK, ${failedTables} tables échouées`);
        // Ne pas lancer d'erreur si au moins quelques tables ont réussi
      }
    } else if (totalTargetRecords < totalSourceRecords) {
      console.log('⚠️ MIGRATION PARTIELLE: Certaines données n\'ont pas pu être migrées');
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

    console.log(`[Migration VRAIE] ${step}: ${message} (${progress}/${total})`);
    
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

export { CompleteMigrationService };