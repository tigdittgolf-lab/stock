import { DatabaseAdapter } from './types';

export interface DiscoveredSchema {
  schemaName: string;
  tables: DiscoveredTable[];
}

export interface DiscoveredTable {
  tableName: string;
  columns: DiscoveredColumn[];
  sampleData: any[];
  recordCount: number;
}

export interface DiscoveredColumn {
  name: string;
  type: string;
  nullable: boolean;
  isPrimaryKey: boolean;
}

/**
 * Service de découverte automatique de la structure Supabase
 * Utilise les fonctions RPC existantes pour analyser la base
 */
export class AutoDiscoveryService {
  private sourceAdapter: DatabaseAdapter;

  constructor(sourceAdapter: DatabaseAdapter) {
    this.sourceAdapter = sourceAdapter;
  }

  async discoverCompleteStructure(): Promise<DiscoveredSchema[]> {
    console.log('🔍 Découverte automatique de la structure Supabase...');

    // 1. Découvrir les schémas tenant
    const schemas = await this.discoverSchemas();
    console.log(`📋 ${schemas.length} schémas découverts:`, schemas);

    const discoveredSchemas: DiscoveredSchema[] = [];

    // 2. Pour chaque schéma, découvrir les tables
    for (const schemaName of schemas) {
      console.log(`🔍 Analyse du schéma ${schemaName}...`);
      
      const tables = await this.discoverTablesInSchema(schemaName);
      
      discoveredSchemas.push({
        schemaName,
        tables
      });

      console.log(`✅ ${schemaName}: ${tables.length} tables découvertes`);
    }

    return discoveredSchemas;
  }

  private async discoverSchemas(): Promise<string[]> {
    // Essayer différentes approches pour découvrir les schémas
    const possibleSchemas = ['2025_bu01', '2024_bu01', '2023_bu01', '2022_bu01'];
    const validSchemas: string[] = [];

    for (const schema of possibleSchemas) {
      try {
        // Tester si le schéma existe en essayant de récupérer des articles
        const result = await this.sourceAdapter.executeRPC('get_articles_by_tenant', { p_tenant: schema });
        
        if (result.success) {
          validSchemas.push(schema);
          console.log(`✅ Schéma ${schema} trouvé`);
        } else {
          console.log(`❌ Schéma ${schema} non trouvé`);
        }
      } catch (error) {
        console.log(`❌ Erreur test schéma ${schema}:`, error);
      }
    }

    return validSchemas;
  }

  private async discoverTablesInSchema(schemaName: string): Promise<DiscoveredTable[]> {
    const tables: DiscoveredTable[] = [];

    // Liste des fonctions RPC connues et leurs tables correspondantes
    const knownRPCFunctions = [
      { rpc: 'get_articles_by_tenant', table: 'article' },
      { rpc: 'get_clients_by_tenant', table: 'client' },
      { rpc: 'get_fournisseurs_by_tenant', table: 'fournisseur' },
      { rpc: 'get_activites_by_tenant', table: 'activite' },
      { rpc: 'get_famille_art_by_tenant', table: 'famille_art' },
      { rpc: 'get_bls_by_tenant', table: 'bl' },
      { rpc: 'get_factures_by_tenant', table: 'facture' },
      { rpc: 'get_proformas_by_tenant', table: 'proforma' },
      { rpc: 'get_detail_bl_by_tenant', table: 'detail_bl' },
      { rpc: 'get_detail_fact_by_tenant', table: 'detail_fact' },
      { rpc: 'get_detail_proforma_by_tenant', table: 'detail_proforma' }
    ];

    for (const { rpc, table } of knownRPCFunctions) {
      try {
        console.log(`🔍 Test de la fonction ${rpc} pour ${table}...`);
        
        const result = await this.sourceAdapter.executeRPC(rpc, { p_tenant: schemaName });
        
        if (result.success && result.data) {
          const data = Array.isArray(result.data) ? result.data : [result.data];
          const recordCount = data.length;
          
          // Analyser la structure des colonnes à partir des données
          const columns = this.analyzeColumnsFromData(data, table);
          
          tables.push({
            tableName: table,
            columns,
            sampleData: data.slice(0, 2), // Garder 2 échantillons
            recordCount
          });

          console.log(`✅ Table ${table}: ${recordCount} enregistrements, ${columns.length} colonnes`);
        } else {
          console.log(`❌ Table ${table}: fonction ${rpc} non disponible ou vide`);
        }
      } catch (error) {
        console.log(`❌ Erreur analyse table ${table}:`, error);
      }
    }

    return tables;
  }

  private analyzeColumnsFromData(data: any[], tableName: string): DiscoveredColumn[] {
    if (!data || data.length === 0) {
      return this.getDefaultColumnsForTable(tableName);
    }

    const firstRecord = data[0];
    const columns: DiscoveredColumn[] = [];

    // Analyser chaque propriété du premier enregistrement
    for (const [key, value] of Object.entries(firstRecord)) {
      const column: DiscoveredColumn = {
        name: key,
        type: this.inferTypeFromValue(value),
        nullable: value === null || value === undefined,
        isPrimaryKey: this.isPrimaryKeyColumn(key, tableName)
      };

      columns.push(column);
    }

    // Trier les colonnes par ordre logique (PK en premier)
    columns.sort((a, b) => {
      if (a.isPrimaryKey && !b.isPrimaryKey) return -1;
      if (!a.isPrimaryKey && b.isPrimaryKey) return 1;
      return a.name.localeCompare(b.name);
    });

    return columns;
  }

  private inferTypeFromValue(value: any): string {
    if (value === null || value === undefined) return 'text';
    
    const type = typeof value;
    
    switch (type) {
      case 'string':
        // Si c'est une date ISO
        if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
          return value.includes('T') ? 'timestamp' : 'date';
        }
        return value.length > 255 ? 'text' : 'varchar';
      
      case 'number':
        return Number.isInteger(value) ? 'integer' : 'decimal';
      
      case 'boolean':
        return 'boolean';
      
      default:
        return 'text';
    }
  }

  private isPrimaryKeyColumn(columnName: string, tableName: string): boolean {
    const primaryKeyPatterns: Record<string, string[]> = {
      'article': ['narticle', 'Narticle'],
      'client': ['nclient', 'Nclient'],
      'fournisseur': ['nfournisseur', 'Nfournisseur'],
      'activite': ['id'],
      'famille_art': ['id'],
      'bl': ['nfact', 'NFact'],
      'facture': ['nfact', 'NFact'],
      'proforma': ['nfact', 'NFact'],
      'detail_bl': ['id'],
      'detail_fact': ['id'],
      'detail_proforma': ['id']
    };

    const patterns = primaryKeyPatterns[tableName] || ['id'];
    return patterns.includes(columnName);
  }

  private getDefaultColumnsForTable(tableName: string): DiscoveredColumn[] {
    // Structures par défaut si aucune donnée n'est disponible
    const defaultStructures: Record<string, DiscoveredColumn[]> = {
      'article': [
        { name: 'narticle', type: 'varchar', nullable: false, isPrimaryKey: true },
        { name: 'designation', type: 'varchar', nullable: true, isPrimaryKey: false },
        { name: 'famille', type: 'varchar', nullable: true, isPrimaryKey: false },
        { name: 'prix_unitaire', type: 'decimal', nullable: true, isPrimaryKey: false },
        { name: 'prix_vente', type: 'decimal', nullable: true, isPrimaryKey: false }
      ],
      'client': [
        { name: 'nclient', type: 'varchar', nullable: false, isPrimaryKey: true },
        { name: 'raison_sociale', type: 'varchar', nullable: true, isPrimaryKey: false },
        { name: 'adresse', type: 'text', nullable: true, isPrimaryKey: false }
      ]
    };

    return defaultStructures[tableName] || [
      { name: 'id', type: 'integer', nullable: false, isPrimaryKey: true }
    ];
  }

  generateCreateTableSQL(table: DiscoveredTable, schemaName: string, isMySQL: boolean): string {
    const tableName = isMySQL ? `\`${table.tableName}\`` : `"${table.tableName}"`;
    
    const columns = table.columns.map(col => {
      let columnDef = `${col.name} `;
      
      // Mapper les types pour MySQL
      if (isMySQL) {
        columnDef += this.mapTypeToMySQL(col.type);
      } else {
        columnDef += col.type;
      }

      if (!col.nullable) {
        columnDef += ' NOT NULL';
      }

      return columnDef;
    }).join(',\n        ');

    // Ajouter PRIMARY KEY
    const primaryKeys = table.columns.filter(col => col.isPrimaryKey).map(col => col.name);
    let primaryKeyClause = '';
    if (primaryKeys.length > 0) {
      primaryKeyClause = `,\n        PRIMARY KEY (${primaryKeys.join(', ')})`;
    }

    return `CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columns}${primaryKeyClause}
      )`;
  }

  private mapTypeToMySQL(type: string): string {
    switch (type.toLowerCase()) {
      case 'varchar':
        return 'VARCHAR(255)';
      case 'text':
        return 'TEXT';
      case 'integer':
        return 'INT';
      case 'decimal':
        return 'DECIMAL(10,2)';
      case 'boolean':
        return 'BOOLEAN';
      case 'timestamp':
        return 'TIMESTAMP';
      case 'date':
        return 'DATE';
      default:
        return 'TEXT';
    }
  }
}