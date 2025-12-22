import { DatabaseConfig, QueryResult, DatabaseAdapter } from '../types';

/**
 * Adaptateur MySQL réel utilisant des requêtes HTTP vers une API
 * Évite les dépendances lourdes côté client
 */
export class MySQLAdapter implements DatabaseAdapter {
  private config: DatabaseConfig;
  private connected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Connexion MySQL:', this.config.host);
      
      // Test de connexion via API
      const testResult = await this.query('SELECT 1 as test');
      this.connected = testResult.success;
      
      if (this.connected) {
        console.log('✅ Connexion MySQL établie');
      } else {
        console.error('❌ Échec connexion MySQL');
      }
      
      return this.connected;
    } catch (error) {
      console.error('❌ Erreur connexion MySQL:', error);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('🔌 Déconnexion MySQL');
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    try {
      console.log('🔍 Requête MySQL:', sql.substring(0, 100) + (sql.length > 100 ? '...' : ''));
      
      // Appel vers l'API MySQL via fetch
      const response = await fetch('http://localhost:3000/api/database/mysql', {
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
      console.error('❌ Erreur requête MySQL:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur MySQL'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    return await this.connect();
  }

  async getSchemas(): Promise<string[]> {
    try {
      const result = await this.query('SHOW DATABASES');
      if (result.success && result.data) {
        // Filtrer les bases de données système
        const databases = result.data
          .map((row: any) => row.Database || row.database)
          .filter((db: string) => 
            !['information_schema', 'performance_schema', 'mysql', 'sys'].includes(db) &&
            /^\d{4}_bu\d{2}$/.test(db) // Format YYYY_buXX
          );
        
        console.log('📋 Schémas MySQL trouvés:', databases);
        return databases;
      }
      return [];
    } catch (error) {
      console.error('❌ Erreur récupération schémas MySQL:', error);
      return [];
    }
  }

  async createSchema(schemaName: string): Promise<boolean> {
    try {
      console.log('🏗️ Création base MySQL:', schemaName);
      const result = await this.query(`CREATE DATABASE IF NOT EXISTS \`${schemaName}\``);
      return result.success;
    } catch (error) {
      console.error('❌ Erreur création base MySQL:', error);
      return false;
    }
  }

  async executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    // MySQL n'a pas de RPC comme Supabase, simuler avec des requêtes SQL
    console.log('🔧 Simulation RPC MySQL:', functionName, params);
    
    try {
      switch (functionName) {
        case 'get_articles_by_tenant':
          return await this.query(
            `SELECT * FROM \`${params.p_tenant}\`.article ORDER BY narticle`
          );
        
        case 'get_clients_by_tenant':
          return await this.query(
            `SELECT * FROM \`${params.p_tenant}\`.client ORDER BY nclient`
          );
        
        case 'get_fournisseurs_by_tenant':
          return await this.query(
            `SELECT * FROM \`${params.p_tenant}\`.fournisseur ORDER BY nfournisseur`
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
        error: error instanceof Error ? error.message : 'Erreur RPC MySQL'
      };
    }
  }
}