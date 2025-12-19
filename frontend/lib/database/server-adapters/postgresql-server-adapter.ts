import { Pool, PoolClient } from 'pg';
import { DatabaseAdapter, DatabaseConfig, QueryResult } from '../types';

/**
 * Adaptateur PostgreSQL pour le côté serveur uniquement
 * Ne peut pas être utilisé dans les composants client
 */
export class PostgreSQLServerAdapter implements DatabaseAdapter {
  private config: DatabaseConfig;
  private pool: Pool | null = null;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Tentative connexion PostgreSQL serveur:', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username
      });

      // Validation de la configuration
      if (!this.config.host || !this.config.database || !this.config.username) {
        throw new Error('Configuration PostgreSQL incomplète');
      }

      // Créer le pool de connexions
      this.pool = new Pool({
        host: this.config.host,
        port: this.config.port || 5432,
        database: this.config.database,
        user: this.config.username,
        password: this.config.password,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });

      // Test de connexion
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();

      console.log('✅ Connexion PostgreSQL serveur établie');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion PostgreSQL serveur:', error);
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
      console.log('🔌 Déconnexion PostgreSQL serveur');
    }
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.pool) {
      return { success: false, error: 'Pas de connexion PostgreSQL' };
    }

    let client: PoolClient | null = null;
    try {
      console.log('🔍 Requête PostgreSQL serveur:', sql, params);
      
      client = await this.pool.connect();
      const result = await client.query(sql, params);

      return {
        success: true,
        data: result.rows,
        rowCount: result.rowCount || 0
      };
    } catch (error) {
      console.error('❌ Erreur requête PostgreSQL serveur:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur requête PostgreSQL'
      };
    } finally {
      if (client) {
        client.release();
      }
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
      console.error('❌ Test connexion PostgreSQL serveur échoué:', error);
      return false;
    }
  }

  async getSchemas(): Promise<string[]> {
    try {
      const result = await this.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name LIKE '%_bu%'
        ORDER BY schema_name
      `);

      if (result.success && result.data) {
        return result.data.map(row => row.schema_name);
      }

      return [];
    } catch (error) {
      console.error('Erreur récupération schémas PostgreSQL serveur:', error);
      return [];
    }
  }

  async createSchema(schemaName: string): Promise<boolean> {
    try {
      const result = await this.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      console.log('🏗️ Schéma PostgreSQL serveur créé:', schemaName);
      return result.success;
    } catch (error) {
      console.error('Erreur création schéma PostgreSQL serveur:', error);
      return false;
    }
  }

  async executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    try {
      console.log('🔧 Exécution fonction PostgreSQL serveur:', functionName, params);

      let sql = '';
      const paramValues: any[] = [];

      switch (functionName) {
        case 'get_articles':
          sql = `SELECT * FROM "${params.p_tenant}".article ORDER BY narticle`;
          break;
        case 'get_clients':
          sql = `SELECT * FROM "${params.p_tenant}".client ORDER BY nclient`;
          break;
        case 'get_suppliers':
          sql = `SELECT * FROM "${params.p_tenant}".fournisseur ORDER BY nfournisseur`;
          break;
        case 'get_delivery_notes':
          sql = `SELECT * FROM "${params.p_tenant}".bl ORDER BY nbl DESC`;
          break;
        case 'get_invoices':
          sql = `SELECT * FROM "${params.p_tenant}".facture ORDER BY nfact DESC`;
          break;
        case 'get_proformas':
          sql = `SELECT * FROM "${params.p_tenant}".proforma ORDER BY nproforma DESC`;
          break;
        case 'get_families':
          sql = `SELECT * FROM "${params.p_tenant}".famille_art ORDER BY famille`;
          break;
        case 'get_tenant_activite':
          sql = `SELECT * FROM "${params.p_tenant}".activite LIMIT 1`;
          break;
        case 'update_tenant_activite':
          const data = params.p_data;
          const setClauses: string[] = [];
          const values: any[] = [];
          let paramIndex = 1;

          Object.entries(data).forEach(([key, value]) => {
            setClauses.push(`${key} = $${paramIndex}`);
            values.push(value);
            paramIndex++;
          });

          sql = `UPDATE "${params.p_tenant}".activite SET ${setClauses.join(', ')}`;
          return await this.query(sql, values);
        default:
          return { success: false, error: `Fonction RPC non supportée: ${functionName}` };
      }

      return await this.query(sql, paramValues);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur RPC PostgreSQL serveur'
      };
    }
  }

  getPool(): Pool | null {
    return this.pool;
  }
}