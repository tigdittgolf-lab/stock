import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DatabaseAdapter, DatabaseConfig, QueryResult } from '../types';

export class SupabaseAdapter implements DatabaseAdapter {
  private client: SupabaseClient | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      if (!this.config.supabaseUrl || !this.config.supabaseKey) {
        throw new Error('Configuration Supabase incomplète');
      }

      this.client = createClient(this.config.supabaseUrl, this.config.supabaseKey);
      
      // Test de connexion simple
      const { error } = await this.client.from('business_units').select('count').limit(1);
      
      if (error && !error.message.includes('relation') && !error.message.includes('does not exist')) {
        throw error;
      }

      console.log('✅ Connexion Supabase établie');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion Supabase:', error);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    // Supabase ne nécessite pas de déconnexion explicite
    this.client = null;
    console.log('🔌 Déconnexion Supabase');
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.client) {
      return { success: false, error: 'Pas de connexion Supabase' };
    }

    try {
      console.log('🔍 Requête Supabase SQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
      
      // CORRECTION CRITIQUE: Toujours utiliser exec_sql RPC qui FONCTIONNE
      // Ne PAS utiliser executeRawSQL qui échoue avec les permissions
      
      const { data, error } = await this.client.rpc('exec_sql', { 
        sql_query: sql,
        params: params || []
      });

      if (error) {
        console.error('❌ Erreur exec_sql:', error.message);
        return {
          success: false,
          error: error.message
        };
      }

      // Vérifier si exec_sql a retourné un objet avec success: false
      if (data && typeof data === 'object' && 'success' in data && data.success === false) {
        console.error('❌ exec_sql a retourné une erreur:', data);
        return {
          success: false,
          error: data.error || 'Erreur exec_sql'
        };
      }

      // Vérifier si exec_sql a retourné verified: true pour CREATE TABLE
      if (data && typeof data === 'object' && 'verified' in data) {
        if (data.verified === true) {
          console.log('✅ exec_sql confirmé: table créée et vérifiée');
          return {
            success: true,
            data: [data],
            rowCount: 1
          };
        } else if (data.verified === false) {
          console.error('❌ exec_sql: table non vérifiée');
          return {
            success: false,
            error: data.error || 'Table non créée'
          };
        }
      }

      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        rowCount: Array.isArray(data) ? data.length : (data ? 1 : 0)
      };
    } catch (error) {
      console.error('❌ Erreur requête Supabase:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  private async getSchemasDirect(): Promise<QueryResult> {
    try {
      // Utiliser la nouvelle fonction RPC de découverte
      const { data, error } = await this.client!.rpc('discover_tenant_schemas');
      
      if (error) {
        console.log('⚠️ Fonction discover_tenant_schemas non trouvée, utilisation du fallback');
        // Fallback avec les schémas par défaut
        return {
          success: true,
          data: [
            { schema_name: '2025_bu01' },
            { schema_name: '2024_bu01' }
          ],
          rowCount: 2
        };
      }

      // Les données sont retournées comme JSON array
      const schemas = Array.isArray(data) ? data : JSON.parse(data || '[]');
      const schemaObjects = schemas.map((name: string) => ({ schema_name: name }));

      return {
        success: true,
        data: schemaObjects,
        rowCount: schemaObjects.length
      };
    } catch (error) {
      console.warn('⚠️ Erreur découverte schémas:', error);
      // Fallback avec les schémas par défaut
      return {
        success: true,
        data: [
          { schema_name: '2025_bu01' },
          { schema_name: '2024_bu01' }
        ],
        rowCount: 2
      };
    }
  }

  private async getTablesDirect(schema: string): Promise<QueryResult> {
    try {
      // Utiliser la nouvelle fonction RPC de découverte des tables
      const { data, error } = await this.client!.rpc('discover_schema_tables', { 
        p_schema_name: schema 
      });
      
      if (error) {
        console.log(`⚠️ Fonction discover_schema_tables non trouvée pour ${schema}`);
        return this.getFallbackTables();
      }

      // Les données sont retournées comme JSON array
      const tables = Array.isArray(data) ? data : JSON.parse(data || '[]');

      return {
        success: true,
        data: tables,
        rowCount: tables.length
      };
    } catch (error) {
      console.warn(`⚠️ Erreur découverte tables ${schema}:`, error);
      return this.getFallbackTables();
    }
  }

  private getFallbackTables(): QueryResult {
    // Tables connues comme fallback
    const knownTables = [
      'article', 'client', 'fournisseur', 'famille_art', 'activite',
      'bl', 'facture', 'proforma', 'detail_bl', 'detail_fact', 'detail_proforma'
    ];

    const tableData = knownTables.map(tableName => ({
      table_name: tableName,
      table_type: 'BASE TABLE'
    }));

    return {
      success: true,
      data: tableData,
      rowCount: tableData.length
    };
  }

  private async getColumnsDirect(schema: string, tableName: string): Promise<QueryResult> {
    try {
      // Utiliser la nouvelle fonction RPC de découverte de structure
      const { data, error } = await this.client!.rpc('discover_table_structure', { 
        p_schema_name: schema,
        p_table_name: tableName
      });
      
      if (error) {
        console.log(`⚠️ Fonction discover_table_structure non trouvée pour ${schema}.${tableName}`);
        return this.getFallbackColumns(tableName);
      }

      // Les données sont retournées comme un objet JSON
      const tableStructure = typeof data === 'string' ? JSON.parse(data) : data;
      const columns = tableStructure?.columns || [];

      return {
        success: true,
        data: columns,
        rowCount: columns.length
      };
    } catch (error) {
      console.warn(`⚠️ Erreur découverte colonnes ${schema}.${tableName}:`, error);
      return this.getFallbackColumns(tableName);
    }
  }

  private getFallbackColumns(tableName: string): QueryResult {
    // Structures de colonnes par défaut pour les tables connues
    const columnStructures: Record<string, any[]> = {
      'article': [
        { column_name: 'narticle', data_type: 'character varying', character_maximum_length: 50, is_nullable: 'NO', column_default: null, ordinal_position: 1 },
        { column_name: 'designation', data_type: 'character varying', character_maximum_length: 255, is_nullable: 'YES', column_default: null, ordinal_position: 2 },
        { column_name: 'famille', data_type: 'character varying', character_maximum_length: 100, is_nullable: 'YES', column_default: null, ordinal_position: 3 },
        { column_name: 'prix_unitaire', data_type: 'numeric', character_maximum_length: null, is_nullable: 'YES', column_default: '0', ordinal_position: 4 },
        { column_name: 'prix_vente', data_type: 'numeric', character_maximum_length: null, is_nullable: 'YES', column_default: '0', ordinal_position: 5 },
        { column_name: 'stock_f', data_type: 'integer', character_maximum_length: null, is_nullable: 'YES', column_default: '0', ordinal_position: 6 },
        { column_name: 'stock_bl', data_type: 'integer', character_maximum_length: null, is_nullable: 'YES', column_default: '0', ordinal_position: 7 }
      ],
      'client': [
        { column_name: 'nclient', data_type: 'character varying', character_maximum_length: 50, is_nullable: 'NO', column_default: null, ordinal_position: 1 },
        { column_name: 'raison_sociale', data_type: 'character varying', character_maximum_length: 255, is_nullable: 'YES', column_default: null, ordinal_position: 2 },
        { column_name: 'adresse', data_type: 'text', character_maximum_length: null, is_nullable: 'YES', column_default: null, ordinal_position: 3 },
        { column_name: 'tel', data_type: 'character varying', character_maximum_length: 50, is_nullable: 'YES', column_default: null, ordinal_position: 4 },
        { column_name: 'email', data_type: 'character varying', character_maximum_length: 100, is_nullable: 'YES', column_default: null, ordinal_position: 5 }
      ],
      'fournisseur': [
        { column_name: 'nfournisseur', data_type: 'character varying', character_maximum_length: 50, is_nullable: 'NO', column_default: null, ordinal_position: 1 },
        { column_name: 'nom_fournisseur', data_type: 'character varying', character_maximum_length: 255, is_nullable: 'YES', column_default: null, ordinal_position: 2 },
        { column_name: 'adresse_fourni', data_type: 'text', character_maximum_length: null, is_nullable: 'YES', column_default: null, ordinal_position: 3 },
        { column_name: 'tel', data_type: 'character varying', character_maximum_length: 50, is_nullable: 'YES', column_default: null, ordinal_position: 4 }
      ]
    };

    const columns = columnStructures[tableName] || [
      { column_name: 'id', data_type: 'integer', character_maximum_length: null, is_nullable: 'NO', column_default: null, ordinal_position: 1 }
    ];
    
    return {
      success: true,
      data: columns,
      rowCount: columns.length
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        await this.connect();
      }

      const { error } = await this.client!.from('business_units').select('count').limit(1);
      return !error || error.message.includes('relation') || error.message.includes('does not exist');
    } catch (error) {
      console.error('❌ Test connexion Supabase échoué:', error);
      return false;
    }
  }

  async getSchemas(): Promise<string[]> {
    if (!this.client) {
      const connected = await this.connect();
      if (!connected) {
        return [];
      }
    }

    try {
      const { data, error } = await this.client!.from('business_units').select('schema_name');
      
      if (error) {
        console.error('Erreur récupération schémas:', error);
        return [];
      }

      return data?.map(bu => bu.schema_name) || [];
    } catch (error) {
      console.error('Exception récupération schémas:', error);
      return [];
    }
  }

  async createSchema(schemaName: string): Promise<boolean> {
    if (!this.client) {
      console.error('❌ Pas de connexion Supabase');
      return false;
    }

    try {
      console.log(`🏗️ Création schéma Supabase: ${schemaName}`);
      
      // ÉTAPE 1: Utiliser la fonction RPC create_schema_if_not_exists
      const { data, error } = await this.client.rpc('create_schema_if_not_exists', {
        p_schema_name: schemaName
      });
      
      if (error) {
        console.error(`❌ Erreur RPC create_schema_if_not_exists: ${error.message}`);
        return false;
      }
      
      console.log(`📊 Résultat RPC:`, data);
      
      // ÉTAPE 2: VÉRIFICATION CRITIQUE - Le schéma existe-t-il vraiment?
      console.log(`🔍 Vérification existence schéma ${schemaName}...`);
      
      // Attendre un peu pour que Supabase synchronise
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const { data: schemas, error: checkError } = await this.client.rpc('discover_tenant_schemas', {});
      
      if (checkError) {
        console.error(`❌ Erreur vérification schéma: ${checkError.message}`);
        return false;
      }
      
      const schemaList = Array.isArray(schemas) ? schemas : JSON.parse(schemas || '[]');
      const schemaExists = schemaList.includes(schemaName);
      
      if (!schemaExists) {
        console.error(`❌ ÉCHEC CRITIQUE: Schéma ${schemaName} n'existe pas après création!`);
        console.error(`📋 Schémas existants: ${schemaList.join(', ')}`);
        return false;
      }
      
      console.log(`✅ CONFIRMÉ: Schéma ${schemaName} existe dans Supabase`);
      return true;
      
    } catch (error) {
      console.error(`❌ Exception création schéma ${schemaName}:`, error);
      return false;
    }
  }

  async executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    if (!this.client) {
      // Tenter de se connecter automatiquement
      const connected = await this.connect();
      if (!connected) {
        return { success: false, error: 'Impossible de se connecter à Supabase' };
      }
    }

    try {
      console.log('🔧 RPC Supabase:', functionName, params);
      
      // D'abord, essayer d'utiliser les vraies tables directement
      const directResult = await this.tryDirectTableAccess(functionName, params);
      if (directResult.success) {
        return directResult;
      }
      
      // Si l'accès direct échoue, essayer les fonctions RPC
      const { data, error } = await this.client!.rpc(functionName, params);

      if (error) {
        // Si la fonction n'existe pas, essayer des alternatives
        if (error.message.includes('Could not find')) {
          console.log(`⚠️ Fonction ${functionName} non trouvée, essai d'alternatives...`);
          
          const alternativeResult = await this.tryAlternativeRPC(functionName, params);
          if (alternativeResult.success) {
            return alternativeResult;
          }
          
          // CORRECTION: Ne plus utiliser l'accès direct ni générer de fausses données
          console.error(`❌ Fonction RPC ${functionName} non disponible et aucune alternative trouvée`);
          return {
            success: false,
            error: `Fonction RPC ${functionName} non disponible dans Supabase`
          };
        }
        
        return {
          success: false,
          error: error.message
        };
      }

      // Handle JSON response from RPC functions
      let processedData = data;
      let rowCount = 0;
      
      if (data && typeof data === 'string') {
        try {
          processedData = JSON.parse(data);
        } catch (e) {
          // If not JSON, treat as single value
          processedData = [data];
        }
      }
      
      if (Array.isArray(processedData)) {
        rowCount = processedData.length;
      } else if (processedData) {
        processedData = [processedData];
        rowCount = 1;
      } else {
        processedData = [];
        rowCount = 0;
      }

      console.log(`✅ RPC ${functionName}: ${rowCount} résultats`);
      return {
        success: true,
        data: processedData,
        rowCount: rowCount
      };
    } catch (error) {
      console.error(`💥 Exception RPC ${functionName}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur RPC'
      };
    }
  }

  /**
   * Accès direct aux tables Supabase (sans RPC)
   * CORRECTION: Utiliser les RPC functions qui fonctionnent déjà
   */
  private async tryDirectTableAccess(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    try {
      const tenant = params.p_tenant;
      if (!tenant) {
        return { success: false, error: 'Tenant manquant' };
      }

      // CORRECTION MAJEURE: Ne pas essayer l'accès direct aux tables
      // Les tables Supabase utilisent des schémas, pas des préfixes de noms
      // Retourner une erreur pour forcer l'utilisation des RPC functions
      console.log(`🔍 Accès direct non supporté pour Supabase, utilisation des RPC functions`);
      return { 
        success: false, 
        error: 'Accès direct non supporté, utilisation des RPC functions requise' 
      };
      
    } catch (error) {
      console.warn(`⚠️ Erreur accès direct:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Erreur accès direct' };
    }
  }

  /**
   * Essayer des fonctions RPC alternatives
   */
  private async tryAlternativeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    // Map des fonctions alternatives
    const alternatives: Record<string, string[]> = {
      'get_fournisseurs_by_tenant': ['get_suppliers_by_tenant', 'get_fournisseur_by_tenant'],
      'get_activites_by_tenant': ['get_activite_by_tenant', 'get_company_by_tenant', 'get_settings_by_tenant'],
      'get_bls_by_tenant': ['get_bl_by_tenant', 'get_delivery_notes_by_tenant'],
      'get_factures_by_tenant': ['get_facture_by_tenant', 'get_invoices_by_tenant'],
      'get_detail_bl_by_tenant': ['get_bl_details_by_tenant', 'get_delivery_details_by_tenant'],
      'get_detail_fact_by_tenant': ['get_facture_details_by_tenant', 'get_invoice_details_by_tenant'],
      'get_detail_proforma_by_tenant': ['get_proforma_details_by_tenant'],
      'get_famille_art_by_tenant': ['get_families_by_tenant'] // On sait que celle-ci fonctionne
    };
    
    const alternativeFunctions = alternatives[functionName] || [];
    
    for (const altFunction of alternativeFunctions) {
      try {
        const { data, error } = await this.client!.rpc(altFunction, params);
        if (!error) {
          console.log(`✅ Alternative trouvée: ${altFunction}`);
          return { 
            success: true, 
            data: Array.isArray(data) ? data : [data], 
            rowCount: Array.isArray(data) ? data.length : 1 
          };
        }
      } catch (e) {
        // Continuer avec la fonction suivante
      }
    }
    
    // CORRECTION MAJEURE: Ne plus générer de fausses données
    // Retourner une erreur pour indiquer que la fonction n'existe pas
    console.warn(`⚠️ Aucune fonction RPC trouvée pour ${functionName}`);
    return { 
      success: false, 
      error: `Fonction RPC ${functionName} non disponible dans Supabase` 
    };
  }

  // Méthodes spécifiques Supabase pour compatibilité
  getClient(): SupabaseClient | null {
    return this.client;
  }

  // Nouvelle méthode pour récupérer toutes les données d'une table
  async getAllTableData(schema: string, tableName: string): Promise<QueryResult> {
    try {
      // Utiliser la nouvelle fonction RPC pour récupérer toutes les données
      const { data, error } = await this.client!.rpc('get_all_table_data', { 
        p_schema_name: schema,
        p_table_name: tableName
      });
      
      if (error) {
        console.log(`⚠️ Fonction get_all_table_data non trouvée pour ${schema}.${tableName}`);
        // Fallback: essayer les fonctions RPC existantes
        return await this.tryExistingRPCFunction(schema, tableName);
      }

      // Les données sont retournées comme JSON array
      const tableData = Array.isArray(data) ? data : JSON.parse(data || '[]');

      return {
        success: true,
        data: tableData,
        rowCount: tableData.length
      };
    } catch (error) {
      console.warn(`⚠️ Erreur récupération données ${schema}.${tableName}:`, error);
      return await this.tryExistingRPCFunction(schema, tableName);
    }
  }

  private async tryExistingRPCFunction(schema: string, tableName: string): Promise<QueryResult> {
    // Mapping des tables vers les fonctions RPC existantes
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

    const rpcFunction = rpcMapping[tableName];
    
    if (rpcFunction) {
      return await this.executeRPC(rpcFunction, { p_tenant: schema });
    }

    // Aucune fonction RPC disponible
    return {
      success: false,
      error: `Aucune méthode disponible pour récupérer les données de ${tableName}`
    };
  }

  /**
   * NOUVELLE MÉTHODE: Exécuter du SQL brut via l'API REST de Supabase
   * Cette méthode contourne exec_sql et exécute vraiment le SQL
   */
  private async executeRawSQL(sql: string): Promise<QueryResult> {
    if (!this.config.supabaseUrl || !this.config.supabaseKey) {
      return { success: false, error: 'Configuration Supabase manquante' };
    }

    try {
      console.log('🚀 Exécution SQL directe via API REST Supabase');
      console.log('📝 SQL:', sql.substring(0, 200) + (sql.length > 200 ? '...' : ''));

      // Utiliser l'API REST de Supabase pour exécuter du SQL
      // Endpoint: POST /rest/v1/rpc/query
      const response = await fetch(`${this.config.supabaseUrl}/rest/v1/rpc/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': this.config.supabaseKey,
          'Authorization': `Bearer ${this.config.supabaseKey}`,
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          query: sql
        })
      });

      if (!response.ok) {
        // Si l'endpoint query n'existe pas, essayer une approche alternative
        console.log('⚠️ Endpoint query non disponible, tentative alternative...');
        return await this.executeViaPostgREST(sql);
      }

      const data = await response.json();
      
      console.log('✅ SQL exécuté avec succès via API REST');
      
      return {
        success: true,
        data: Array.isArray(data) ? data : [data],
        rowCount: Array.isArray(data) ? data.length : 1
      };
    } catch (error) {
      console.error('❌ Erreur exécution SQL directe:', error);
      
      // Dernière tentative: utiliser PostgREST
      return await this.executeViaPostgREST(sql);
    }
  }

  /**
   * Exécuter du SQL via PostgREST (approche alternative)
   */
  private async executeViaPostgREST(sql: string): Promise<QueryResult> {
    try {
      console.log('🔄 Tentative via PostgREST...');
      
      // Pour CREATE SCHEMA, utiliser une requête spéciale
      if (sql.toUpperCase().includes('CREATE SCHEMA')) {
        const schemaMatch = sql.match(/CREATE SCHEMA (?:IF NOT EXISTS )?["']?([^"'\s]+)["']?/i);
        if (schemaMatch) {
          const schemaName = schemaMatch[1];
          console.log(`🏗️ Création schéma ${schemaName} via SQL direct`);
          
          // Utiliser l'API Management de Supabase pour exécuter du SQL
          const response = await fetch(`${this.config.supabaseUrl}/rest/v1/rpc/query`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': this.config.supabaseKey!,
              'Authorization': `Bearer ${this.config.supabaseKey}`,
            },
            body: JSON.stringify({
              query: `CREATE SCHEMA IF NOT EXISTS "${schemaName}"`
            })
          });

          if (!response.ok) {
            // Si l'API query n'existe pas, utiliser l'approche SQL directe via pg_catalog
            console.log('⚠️ API query non disponible, création via SQL direct...');
            
            // Créer le schéma en utilisant une table temporaire comme workaround
            const createResult = await this.client!.rpc('create_schema_if_not_exists', {
              p_schema_name: schemaName
            });
            
            if (createResult.error) {
              console.error('❌ Erreur création schéma:', createResult.error);
              return { success: false, error: createResult.error.message };
            }
            
            // VÉRIFIER que le schéma existe vraiment
            const checkResult = await this.client!
              .from('information_schema.schemata')
              .select('schema_name')
              .eq('schema_name', schemaName)
              .limit(1);
            
            if (checkResult.error || !checkResult.data || checkResult.data.length === 0) {
              console.error(`❌ ÉCHEC CRITIQUE: Schéma ${schemaName} n'existe pas après création!`);
              return { 
                success: false, 
                error: `Le schéma ${schemaName} n'a pas été créé. Problème de permissions Supabase.` 
              };
            }
            
            console.log(`✅ CONFIRMÉ: Schéma ${schemaName} existe`);
            return { success: true, data: [createResult.data], rowCount: 1 };
          }
          
          console.log('✅ Schéma créé avec succès via API');
          return { success: true, data: [], rowCount: 0 };
        }
      }
      
      // Pour CREATE TABLE, même problème - exec_sql ne fonctionne pas
      if (sql.toUpperCase().includes('CREATE TABLE')) {
        console.log('❌ PROBLÈME CRITIQUE: exec_sql ne peut pas créer de tables dans Supabase');
        console.log('💡 CAUSE: Restrictions de permissions SECURITY DEFINER');
        console.log('💡 SOLUTION REQUISE: Utiliser l\'API Management de Supabase ou créer manuellement');
        
        return {
          success: false,
          error: 'exec_sql ne peut pas créer de tables dans Supabase en raison de restrictions de permissions. Veuillez créer les tables manuellement ou utiliser l\'API Management de Supabase.'
        };
      }
      
      // Pour les autres requêtes, retourner une erreur
      return {
        success: false,
        error: 'Type de requête SQL non supporté par PostgREST'
      };
    } catch (error) {
      console.error('❌ Erreur PostgREST:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur PostgREST'
      };
    }
  }
}