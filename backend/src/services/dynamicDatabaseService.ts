import { supabaseAdmin } from '../supabaseClient.js';

/**
 * Service de base de données dynamique qui peut utiliser différentes sources
 * selon la configuration active
 */
export class DynamicDatabaseService {
  private static instance: DynamicDatabaseService;
  private currentDatabaseType: 'supabase' | 'mysql' | 'postgresql' = 'mysql'; // CHANGÉ: mysql par défaut
  private currentConfig: any = null;

  private constructor() {}

  static getInstance(): DynamicDatabaseService {
    if (!DynamicDatabaseService.instance) {
      DynamicDatabaseService.instance = new DynamicDatabaseService();
    }
    return DynamicDatabaseService.instance;
  }

  /**
   * Configure le type de base de données à utiliser
   */
  setDatabaseConfig(type: 'supabase' | 'mysql' | 'postgresql', config?: any) {
    console.log(`🔄 Backend: Switching to ${type} database`);
    this.currentDatabaseType = type;
    this.currentConfig = config;
  }

  /**
   * Obtient le type de base de données actuel
   */
  getCurrentDatabaseType(): string {
    return this.currentDatabaseType;
  }

  /**
   * Exécute une fonction RPC selon la base de données active
   */
  async executeRPC(functionName: string, params: Record<string, any>): Promise<any> {
    console.log(`🔧 Backend RPC: ${functionName} on ${this.currentDatabaseType}`);

    switch (this.currentDatabaseType) {
      case 'supabase':
        return await this.executeSupabaseRPC(functionName, params);
      
      case 'mysql':
        return await this.executeMySQLRPC(functionName, params);
      
      case 'postgresql':
        return await this.executePostgreSQLRPC(functionName, params);
      
      default:
        throw new Error(`Database type ${this.currentDatabaseType} not supported`);
    }
  }

  /**
   * Exécute une requête SQL directe selon la base de données active
   */
  async executeQuery(sql: string, params?: any[]): Promise<any> {
    console.log(`🔧 Backend Query: ${sql.substring(0, 50)}... on ${this.currentDatabaseType}`);

    switch (this.currentDatabaseType) {
      case 'supabase':
        return await this.executeSupabaseQuery(sql, params);
      
      case 'mysql':
        return await this.executeMySQLQuery(sql, params);
      
      case 'postgresql':
        return await this.executePostgreSQLQuery(sql, params);
      
      default:
        throw new Error(`Database type ${this.currentDatabaseType} not supported`);
    }
  }

  // Méthodes privées pour chaque type de base de données

  private async executeSupabaseRPC(functionName: string, params: Record<string, any>): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin.rpc(functionName, params);
      
      if (error) {
        console.error('❌ Supabase RPC Error:', error);
        return { success: false, error: error.message, data: null };
      }
      
      return { success: true, data, error: null };
    } catch (error) {
      console.error('❌ Supabase RPC Exception:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', data: null };
    }
  }

  private async executeMySQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    try {
      // Pour MySQL, on simule les fonctions RPC avec des requêtes SQL directes
      console.log(`🐬 MySQL RPC simulation: ${functionName}`);
      
      switch (functionName) {
        case 'get_articles_by_tenant':
          return await this.getMySQLArticles(params.p_tenant);
        
        case 'get_clients_by_tenant':
          return await this.getMySQLClients(params.p_tenant);
        
        case 'get_fournisseurs_by_tenant':
          return await this.getMySQLSuppliers(params.p_tenant);
        
        default:
          console.warn(`⚠️ MySQL RPC function ${functionName} not implemented`);
          return { success: false, error: `Function ${functionName} not implemented for MySQL`, data: [] };
      }
    } catch (error) {
      console.error('❌ MySQL RPC Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'MySQL error', data: null };
    }
  }

  private async executePostgreSQLRPC(functionName: string, params: Record<string, any>): Promise<any> {
    try {
      // Pour PostgreSQL, on utilise les vraies fonctions RPC si elles existent
      console.log(`🐘 PostgreSQL RPC: ${functionName}`);
      
      switch (functionName) {
        case 'get_articles_by_tenant':
          return await this.getPostgreSQLArticles(params.p_tenant);
        
        case 'get_clients_by_tenant':
          return await this.getPostgreSQLClients(params.p_tenant);
        
        case 'get_fournisseurs_by_tenant':
          return await this.getPostgreSQLSuppliers(params.p_tenant);
        
        default:
          console.warn(`⚠️ PostgreSQL RPC function ${functionName} not implemented`);
          return { success: false, error: `Function ${functionName} not implemented for PostgreSQL`, data: [] };
      }
    } catch (error) {
      console.error('❌ PostgreSQL RPC Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'PostgreSQL error', data: null };
    }
  }

  // Méthodes spécifiques pour MySQL
  private async getMySQLArticles(tenant: string): Promise<any> {
    try {
      // Appel vers l'API MySQL
      const response = await fetch('http://localhost:3000/api/database/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '',
            database: tenant
          },
          sql: 'SELECT * FROM article ORDER BY narticle',
          params: []
        })
      });

      const result = await response.json();
      
      if (result.success) {
        return { success: true, data: result.data, error: null };
      } else {
        return { success: false, error: result.error, data: [] };
      }
    } catch (error) {
      console.error('❌ MySQL Articles Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'MySQL connection error', data: [] };
    }
  }

  private async getMySQLClients(tenant: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/api/database/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '',
            database: tenant
          },
          sql: 'SELECT * FROM client ORDER BY nclient',
          params: []
        })
      });

      const result = await response.json();
      return result.success ? { success: true, data: result.data, error: null } : { success: false, error: result.error, data: [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'MySQL error', data: [] };
    }
  }

  private async getMySQLSuppliers(tenant: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/api/database/mysql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: 'localhost',
            port: 3306,
            username: 'root',
            password: '',
            database: tenant
          },
          sql: 'SELECT * FROM fournisseur ORDER BY nfournisseur',
          params: []
        })
      });

      const result = await response.json();
      return result.success ? { success: true, data: result.data, error: null } : { success: false, error: result.error, data: [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'MySQL error', data: [] };
    }
  }

  // Méthodes spécifiques pour PostgreSQL
  private async getPostgreSQLArticles(tenant: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/api/database/postgresql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'postgres'
          },
          sql: `SELECT * FROM "${tenant}".article ORDER BY narticle`,
          params: []
        })
      });

      const result = await response.json();
      return result.success ? { success: true, data: result.data, error: null } : { success: false, error: result.error, data: [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'PostgreSQL error', data: [] };
    }
  }

  private async getPostgreSQLClients(tenant: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/api/database/postgresql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'postgres'
          },
          sql: `SELECT * FROM "${tenant}".client ORDER BY nclient`,
          params: []
        })
      });

      const result = await response.json();
      return result.success ? { success: true, data: result.data, error: null } : { success: false, error: result.error, data: [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'PostgreSQL error', data: [] };
    }
  }

  private async getPostgreSQLSuppliers(tenant: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/api/database/postgresql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: {
            host: 'localhost',
            port: 5432,
            username: 'postgres',
            password: 'postgres',
            database: 'postgres'
          },
          sql: `SELECT * FROM "${tenant}".fournisseur ORDER BY nfournisseur`,
          params: []
        })
      });

      const result = await response.json();
      return result.success ? { success: true, data: result.data, error: null } : { success: false, error: result.error, data: [] };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'PostgreSQL error', data: [] };
    }
  }

  // Méthodes de requête SQL directe (à implémenter si nécessaire)
  private async executeSupabaseQuery(sql: string, params?: any[]): Promise<any> {
    // Implémentation pour Supabase si nécessaire
    throw new Error('Direct SQL queries not implemented for Supabase');
  }

  private async executeMySQLQuery(sql: string, params?: any[]): Promise<any> {
    // Implémentation pour MySQL si nécessaire
    throw new Error('Direct SQL queries not implemented for MySQL');
  }

  private async executePostgreSQLQuery(sql: string, params?: any[]): Promise<any> {
    // Implémentation pour PostgreSQL si nécessaire
    throw new Error('Direct SQL queries not implemented for PostgreSQL');
  }
}

// Export de l'instance singleton
export const dynamicDB = DynamicDatabaseService.getInstance();