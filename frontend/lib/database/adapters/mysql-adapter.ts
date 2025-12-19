import { DatabaseAdapter, DatabaseConfig, QueryResult } from '../types';

/**
 * Adaptateur MySQL pour le côté client (simulation)
 * Pour les vraies connexions, utiliser MySQLServerAdapter côté serveur
 */
export class MySQLAdapter implements DatabaseAdapter {
  private config: DatabaseConfig;
  private connected: boolean = false;

  constructor(config: DatabaseConfig) {
    this.config = config;
  }

  async connect(): Promise<boolean> {
    try {
      console.log('🔌 Simulation connexion MySQL client:', {
        host: this.config.host,
        port: this.config.port,
        database: this.config.database,
        user: this.config.username
      });

      // Validation de la configuration
      if (!this.config.host || !this.config.database || !this.config.username) {
        throw new Error('Configuration MySQL incomplète');
      }

      // Simulation d'une connexion
      await new Promise(resolve => setTimeout(resolve, 500));
      this.connected = true;

      console.log('✅ Connexion MySQL client simulée');
      return true;
    } catch (error) {
      console.error('❌ Erreur connexion MySQL client:', error);
      this.connected = false;
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log('🔌 Déconnexion MySQL client');
  }

  async query(sql: string, params?: any[]): Promise<QueryResult> {
    if (!this.connected) {
      return { success: false, error: 'Pas de connexion MySQL' };
    }

    try {
      console.log('🔍 Simulation requête MySQL client:', sql, params);
      
      // Simulation de requête avec délai
      await new Promise(resolve => setTimeout(resolve, 100));

      // Données simulées selon le type de requête
      let mockData: any[] = [];
      if (sql.toLowerCase().includes('select')) {
        if (sql.includes('article')) {
          mockData = [
            { narticle: 'ART001', designation: 'Article MySQL Local', prix_vente: 150 }
          ];
        } else if (sql.includes('client')) {
          mockData = [
            { nclient: 'CLI001', nom_client: 'Client MySQL Local' }
          ];
        } else if (sql.includes('SCHEMA_NAME')) {
          mockData = [
            { schema_name: '2025_bu01_mysql' },
            { schema_name: '2024_bu01_mysql' }
          ];
        }
      }

      return {
        success: true,
        data: mockData,
        rowCount: mockData.length
      };
    } catch (error) {
      console.error('❌ Erreur requête MySQL client:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur requête MySQL'
      };
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.connected) {
        return await this.connect();
      }

      const result = await this.query('SELECT 1 as test');
      return result.success;
    } catch (error) {
      console.error('❌ Test connexion MySQL client échoué:', error);
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
      console.error('Erreur récupération schémas MySQL client:', error);
      return [];
    }
  }

  async createSchema(schemaName: string): Promise<boolean> {
    try {
      console.log('🏗️ Simulation création schéma MySQL client:', schemaName);
      await new Promise(resolve => setTimeout(resolve, 200));
      return true;
    } catch (error) {
      console.error('Erreur création schéma MySQL client:', error);
      return false;
    }
  }

  async executeRPC(functionName: string, params: Record<string, any>): Promise<QueryResult> {
    try {
      console.log('🔧 Simulation fonction MySQL client:', functionName, params);

      // Simulation avec données de test
      await new Promise(resolve => setTimeout(resolve, 150));

      let mockData: any = null;

      switch (functionName) {
        case 'get_articles':
          mockData = [
            { narticle: 'ART001', designation: 'Article MySQL Local', prix_vente: 150 },
            { narticle: 'ART002', designation: 'Article MySQL Local 2', prix_vente: 250 }
          ];
          break;
        case 'get_clients':
          mockData = [
            { nclient: 'CLI001', nom_client: 'Client MySQL Local' }
          ];
          break;
        case 'get_suppliers':
          mockData = [
            { nfournisseur: 'FOUR001', nom_fournisseur: 'Fournisseur MySQL Local' }
          ];
          break;
        case 'get_tenant_activite':
          mockData = {
            nom_entreprise: 'Entreprise MySQL Local',
            adresse: 'Adresse MySQL Local',
            telephone: '987654321',
            email: 'test@mysql.local',
            activite: 'Commerce MySQL'
          };
          break;
        case 'update_tenant_activite':
          return { success: true, data: [{ message: 'Mise à jour MySQL simulée' }] };
        default:
          return { success: false, error: `Fonction RPC non supportée côté client: ${functionName}` };
      }

      return {
        success: true,
        data: mockData,
        rowCount: Array.isArray(mockData) ? mockData.length : 1
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur RPC MySQL client'
      };
    }
  }

  // Méthode utilitaire (simulation)
  getPool(): any {
    return { connected: this.connected };
  }
}