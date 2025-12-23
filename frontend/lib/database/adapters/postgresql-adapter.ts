import { DatabaseConfig, QueryResult, DatabaseAdapter } from '../types';

/**
 * Adaptateur PostgreSQL réel utilisant des requêtes HTTP vers une API
 * Évite les dépendances lourdes côté client
 */
export class PostgreSQLAdapter implements DatabaseAdapter {
  private config: DatabaseConfig;
  private connected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connexion PostgreSQL:', this.config.host);
      
      // Test de connexion via API
      const testResult = await this.query('SELECT 1 as test');
      this.connected = testResult.success;
      
      if (this.connected) {
        console.log('✅ Connexion PostgreSQL établie');
      } else {
        console.error('❌ Échec connexion PostgreSQL');
      }
      
      return this.connected;
    } catch (error) {
      console.error('❌ Erreur connexion PostgreSQL:', error);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('🔌 Déconnexion PostgreSQL');
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      console.log('🔍 Requête PostgreSQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
      
      // Appel vers l'API PostgreSQL via fetch
      const response = await fetch('http://localhost:3000/api/database/postgresql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          config: this.config,
          sql,
          params
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('❌ Erreur requête PostgreSQL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur PostgreSQL'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    return await this.connect();
  }

  async getSchemas(): Promise<string[]> {
    try {
      const result = await this.query(`
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name ~ '^\\d{4}_bu\\d{2}$'$'
        ORDER BY schema_name
      `);
      
      if (result.success && result.data) {
        const schemas = result.data.map((row: any) => row.schema_name);
        console.log('📋 Schémas PostgreSQL trouvés:', schemas);
        return schemas;
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération schémas PostgreSQL:', error);
      return [];
    }
  }

  async createSchema(schemaName: string): Promise<boolean> {
    try {
      console.log('🏗️ Création schéma PostgreSQL:', schemaName);
      const result = await this.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
      return result.success;
    } catch (error) {
      console.error('❌ Erreur création schéma PostgreSQL:', error);
      return false;
    }
  }

  async executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    // PostgreSQL peut utiliser des fonctions stockées, simuler avec des requêtes SQL
    console.log('🔧 Simulation RPC PostgreSQL:', functionName, params);
    
    try {
      switch (functionName) {
        case 'get_articles_by_tenant':
          return await this.query(
            `SELECT * FROM "${params.p_tenant}".article ORDER BY narticle`
          );
        
        case 'get_clients_by_tenant':
          return await this.query(
            `SELECT * FROM "${params.p_tenant}".client ORDER BY nclient`
          );
        
        case 'get_fournisseurs_by_tenant':
          return await this.query(
            `SELECT * FROM "${params.p_tenant}".fournisseur ORDER BY nfournisseur`
          );
        
        default:
          return {
            success: false,
            error: `Fonction RPC non supportée: ${functionName}`
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur RPC PostgreSQL'
      };
    }
  }
}