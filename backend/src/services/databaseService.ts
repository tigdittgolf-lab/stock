import { supabaseAdmin } from '../supabaseClient.js';
import mysql from 'mysql2/promise';
import { Client } from 'pg';

export type DatabaseType = 'supabase' | 'postgresql' | 'mysql';

export interface DatabaseConfig {
  type: DatabaseType;
  name: string;
  // Supabase config
  supabaseUrl?: string;
  supabaseKey?: string;
  // Local database config
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

export class BackendDatabaseService {
  private static instance: BackendDatabaseService;
  private activeConfig: DatabaseConfig | null = null;
  private mysqlConnection: mysql.Connection | null = null;
  private pgClient: Client | null = null;

  private constructor() {
    this.loadActiveConfig();
  }

  public static getInstance(): BackendDatabaseService {
    if (!BackendDatabaseService.instance) {
      BackendDatabaseService.instance = new BackendDatabaseService();
    }
    return BackendDatabaseService.instance;
  }

  private loadActiveConfig(): void {
    // Essayer de charger depuis les variables d'environnement ou fichier de config
    // Pour l'instant, utiliser Supabase par défaut
    this.activeConfig = {
      type: 'supabase',
      name: 'Supabase Production',
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    };
  }

  public getActiveDatabaseType(): DatabaseType {
    return this.activeConfig?.type || 'supabase';
  }

  public async switchDatabase(config: DatabaseConfig): Promise<boolean> {
    try {
      console.log(`🔄 Backend switching to database: ${config.type} (${config.name})`);
      
      // Fermer les connexions existantes
      await this.closeConnections();
      
      // Tester la nouvelle configuration
      const testResult = await this.testConnection(config);
      if (!testResult) {
        throw new Error('Connection test failed');
      }
      
      // Sauvegarder la nouvelle configuration
      this.activeConfig = config;
      
      console.log(`✅ Backend database switched to: ${config.type}`);
      return true;
    } catch (error) {
      console.error('❌ Backend database switch failed:', error);
      return false;
    }
  }

  private async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      switch (config.type) {
        case 'supabase':
          // Test Supabase connection
          const { data, error } = await supabaseAdmin.from('information_schema.tables').select('*').limit(1);
          return !error;
          
        case 'mysql':
          // Test MySQL connection
          const mysqlConn = await mysql.createConnection({
            host: config.host || 'localhost',
            port: config.port || 3306,
            user: config.username || 'root',
            password: config.password || '',
            database: config.database || 'stock_local'
          });
          await mysqlConn.ping();
          await mysqlConn.end();
          return true;
          
        case 'postgresql':
          // Test PostgreSQL connection
          const pgClient = new Client({
            host: config.host || 'localhost',
            port: config.port || 5432,
            user: config.username || 'postgres',
            password: config.password || 'postgres',
            database: config.database || 'stock_local'
          });
          await pgClient.connect();
          await pgClient.query('SELECT 1');
          await pgClient.end();
          return true;
          
        default:
          return false;
      }
    } catch (error) {
      console.error(`Connection test failed for ${config.type}:`, error);
      return false;
    }
  }

  private async closeConnections(): Promise<void> {
    try {
      if (this.mysqlConnection) {
        await this.mysqlConnection.end();
        this.mysqlConnection = null;
      }
      if (this.pgClient) {
        await this.pgClient.end();
        this.pgClient = null;
      }
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  }

  // Méthodes pour exécuter des requêtes selon le type de base de données
  public async executeQuery(sql: string, params: any[] = []): Promise<any> {
    const dbType = this.getActiveDatabaseType();
    
    switch (dbType) {
      case 'supabase':
        return this.executeSupabaseQuery(sql, params);
      case 'mysql':
        return this.executeMySQLQuery(sql, params);
      case 'postgresql':
        return this.executePostgreSQLQuery(sql, params);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  public async executeRPC(functionName: string, params: Record<string, any>): Promise<any> {
    const dbType = this.getActiveDatabaseType();
    
    switch (dbType) {
      case 'supabase':
        return this.executeSupabaseRPC(functionName, params);
      case 'mysql':
        return this.executeMySQLRPC(functionName, params);
      case 'postgresql':
        return this.executePostgreSQLRPC(functionName, params);
      default:
        throw new Error(`Unsupported database type: ${dbType}`);
    }
  }

  private async executeSupabaseQuery(sql: string, params: any[]): Promise<any> {
    // Pour Supabase, utiliser les RPC functions
    throw new Error('Direct SQL queries not supported for Supabase. Use RPC functions instead.');
  }

  private async executeSupabaseRPC(functionName: string, params: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin.rpc(functionName, params);
      if (error) {
        throw new Error(`Supabase RPC error: ${error.message}`);
      }
      return { success: true, data };
    } catch (error) {
      console.error(`Supabase RPC ${functionName} failed:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executeMySQLQuery(sql: string, params: any[]): Promise<any> {
    try {
      if (!this.mysqlConnection) {
        this.mysqlConnection = await mysql.createConnection({
          host: this.activeConfig?.host || 'localhost',
          port: this.activeConfig?.port || 3306,
          user: this.activeConfig?.username || 'root',
          password: this.activeConfig?.password || '',
          database: this.activeConfig?.database || 'stock_local'
        });
      }
      
      const [rows] = await this.mysqlConnection.execute(sql, params);
      return { success: true, data: rows };
    } catch (error) {
      console.error('MySQL query failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executeMySQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    // Pour MySQL, convertir les appels RPC en requêtes SQL directes
    return this.convertRPCToSQL('mysql', functionName, params);
  }

  private async executePostgreSQLQuery(sql: string, params: any[]): Promise<any> {
    try {
      if (!this.pgClient) {
        this.pgClient = new Client({
          host: this.activeConfig?.host || 'localhost',
          port: this.activeConfig?.port || 5432,
          user: this.activeConfig?.username || 'postgres',
          password: this.activeConfig?.password || 'postgres',
          database: this.activeConfig?.database || 'stock_local'
        });
        await this.pgClient.connect();
      }
      
      const result = await this.pgClient.query(sql, params);
      return { success: true, data: result.rows };
    } catch (error) {
      console.error('PostgreSQL query failed:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async executePostgreSQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    // Pour PostgreSQL, essayer d'abord les fonctions RPC, sinon convertir en SQL
    try {
      const paramList = Object.entries(params).map(([key, value]) => `${key} => $${Object.keys(params).indexOf(key) + 1}`).join(', ');
      const sql = `SELECT * FROM ${functionName}(${paramList})`;
      const values = Object.values(params);
      
      return await this.executePostgreSQLQuery(sql, values);
    } catch (error) {
      // Si la fonction RPC n'existe pas, convertir en SQL direct
      return this.convertRPCToSQL('postgresql', functionName, params);
    }
  }

  private async convertRPCToSQL(dbType: 'mysql' | 'postgresql', functionName: string, params: Record<string, any>): Promise<any> {
    // Convertir les appels RPC Supabase en requêtes SQL pour les bases locales
    try {
      switch (functionName) {
        case 'get_articles_by_tenant':
          return this.getArticlesByTenant(dbType, params.p_tenant);
        case 'insert_article_to_tenant':
          return this.insertArticleToTenant(dbType, params);
        case 'get_article_by_id_from_tenant':
          return this.getArticleByIdFromTenant(dbType, params.p_tenant, params.p_narticle);
        case 'update_article_in_tenant':
          return this.updateArticleInTenant(dbType, params);
        case 'delete_article_from_tenant':
          return this.deleteArticleFromTenant(dbType, params.p_tenant, params.p_narticle);
        default:
          throw new Error(`RPC function ${functionName} not implemented for ${dbType}`);
      }
    } catch (error) {
      console.error(`RPC to SQL conversion failed for ${functionName}:`, error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private async getArticlesByTenant(dbType: 'mysql' | 'postgresql', tenant: string): Promise<any> {
    const sql = `SELECT * FROM ${tenant}.article ORDER BY narticle`;
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, []) : this.executePostgreSQLQuery(sql, []);
  }

  private async insertArticleToTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_narticle,
      p_famille,
      p_designation,
      p_nfournisseur,
      p_prix_unitaire,
      p_marge,
      p_tva,
      p_prix_vente,
      p_seuil,
      p_stock_f,
      p_stock_bl
    } = params;

    const sql = `
      INSERT INTO ${p_tenant}.article 
      (narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const values = [
      p_narticle, p_famille, p_designation, p_nfournisseur,
      p_prix_unitaire, p_marge, p_tva, p_prix_vente,
      p_seuil, p_stock_f, p_stock_bl
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async getArticleByIdFromTenant(dbType: 'mysql' | 'postgresql', tenant: string, narticle: string): Promise<any> {
    const sql = `SELECT * FROM ${tenant}.article WHERE narticle = ?`;
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [narticle]) : this.executePostgreSQLQuery(sql, [narticle]);
  }

  private async updateArticleInTenant(dbType: 'mysql' | 'postgresql', params: any): Promise<any> {
    const {
      p_tenant,
      p_narticle,
      p_famille,
      p_designation,
      p_nfournisseur,
      p_prix_unitaire,
      p_marge,
      p_tva,
      p_prix_vente,
      p_seuil,
      p_stock_f,
      p_stock_bl
    } = params;

    const sql = `
      UPDATE ${p_tenant}.article 
      SET famille = ?, designation = ?, nfournisseur = ?, prix_unitaire = ?, 
          marge = ?, tva = ?, prix_vente = ?, seuil = ?, stock_f = ?, stock_bl = ?
      WHERE narticle = ?
    `;
    
    const values = [
      p_famille, p_designation, p_nfournisseur, p_prix_unitaire,
      p_marge, p_tva, p_prix_vente, p_seuil, p_stock_f, p_stock_bl,
      p_narticle
    ];

    return dbType === 'mysql' ? this.executeMySQLQuery(sql, values) : this.executePostgreSQLQuery(sql, values);
  }

  private async deleteArticleFromTenant(dbType: 'mysql' | 'postgresql', tenant: string, narticle: string): Promise<any> {
    const sql = `DELETE FROM ${tenant}.article WHERE narticle = ?`;
    return dbType === 'mysql' ? this.executeMySQLQuery(sql, [narticle]) : this.executePostgreSQLQuery(sql, [narticle]);
  }
}

// Export singleton instance
export const backendDatabaseService = BackendDatabaseService.getInstance();