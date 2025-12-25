import mysql from 'mysql2/promise';
import { DatabaseAdapter, DatabaseConfig, QueryResult } from '../types';

/**
 * Adaptateur MySQL pour le côté serveur uniquement
 * Ne peut pas être utilisé dans les composants client
 */
export class MySQLServerAdapter implements DatabaseAdapter {
  private config: DatabaseConfig;
  private pool: mysql.Pool | null = null;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Tentative connexion MySQL serveur:', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username
      });

      if (!this.config.host || !this.config.database || !this.config.username) {
        throw new Error('Configuration MySQL incomplète');
      }

      this.pool = mysql.createPool({
        host: this.config.host,
        port: this.config.port || 3307,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });

      const connection = await this.pool.getConnection();
      await connection.execute('SELECT 1');
      connection.release();

      console.log('✅ Connexion MySQL serveur établie');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion MySQL serveur:', error);
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
      console.log('🔌 Déconnexion MySQL serveur');
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      return { success: false, error: 'Pas de connexion MySQL' };
    }

    try {
      console.log('🔍 Requête MySQL serveur:', sql, params);
      
      const [rows] = await this.pool.execute(sql, params);
      const data = Array.isArray(rows) ? rows : [];

      return {
        success: true,
        data: data,
        rowCount: data.length
      };
    } catch (error) {
      console.error('❌ Erreur requête MySQL serveur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur requête MySQL'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.pool) {
        return await this.connect();
      }

      const result = await this.query('SELECT 1 as test');
      return result.success;
    } catch (error) {
      console.error('❌ Test connexion MySQL serveur échoué:', error);
      return false;
    }
  }

  async getSchemas(): Promise<string[]> {
    try {
      const result = await this.query(`
        SELECT SCHEMA_NAME as schema_name
        FROM information_schema.SCHEMATA 
        WHERE SCHEMA_NAME LIKE '%_bu%'
        ORDER BY SCHEMA_NAME
      `);

      if (result.success && result.data) {
        return result.data.map(row => row.schema_name);
      }

      return [];
    } catch (error) {
      console.error('Erreur récupération schémas MySQL serveur:', error);
      return [];
    }
  }

  async createSchema(schemaName: string): Promise<boolean> {
    try {
      const result = await this.query(`CREATE DATABASE IF NOT EXISTS \`${schemaName}\``);
      console.log('🏗️ Schéma MySQL serveur créé:', schemaName);
      return result.success;
    } catch (error) {
      console.error('Erreur création schéma MySQL serveur:', error);
      return false;
    }
  }

  async executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    try {
      console.log('🔧 Exécution fonction MySQL serveur:', functionName, params);

      let sql = '';
      const paramValues: any[] = [];

      switch (functionName) {
        case 'get_articles':
          sql = `SELECT * FROM \`${params.p_tenant}\`.article ORDER BY narticle`;
          break;
        case 'get_clients':
          sql = `SELECT * FROM \`${params.p_tenant}\`.client ORDER BY nclient`;
          break;
        case 'get_suppliers':
          sql = `SELECT * FROM \`${params.p_tenant}\`.fournisseur ORDER BY nfournisseur`;
          break;
        case 'get_delivery_notes':
          sql = `SELECT * FROM \`${params.p_tenant}\`.bl ORDER BY nbl DESC`;
          break;
        case 'get_invoices':
          sql = `SELECT * FROM \`${params.p_tenant}\`.facture ORDER BY nfact DESC`;
          break;
        case 'get_proformas':
          sql = `SELECT * FROM \`${params.p_tenant}\`.proforma ORDER BY nproforma DESC`;
          break;
        case 'get_families':
          sql = `SELECT * FROM \`${params.p_tenant}\`.famille_art ORDER BY famille`;
          break;
        case 'get_tenant_activite':
          sql = `SELECT * FROM \`${params.p_tenant}\`.activite LIMIT 1`;
          break;
        case 'update_tenant_activite':
          const data = params.p_data;
          const setClauses: string[] = [];
          const values: any[] = [];

          Object.entries(data).forEach(([key, value]) => {
            setClauses.push(`${key} = ?`);
            values.push(value);
          });

          sql = `UPDATE \`${params.p_tenant}\`.activite SET ${setClauses.join(', ')}`;
          return await this.query(sql, values);
        default:
          return { success: false, error: `Fonction RPC non supportée: ${functionName}` };
      }

      return await this.query(sql, paramValues);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur RPC MySQL serveur'
      };
    }
  }

  getPool(): mysql.Pool | null {
    return this.pool;
  }
}