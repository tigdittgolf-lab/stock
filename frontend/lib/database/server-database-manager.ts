import { DatabaseManager, DatabaseAdapter, DatabaseConfig } from './types';
import { SupabaseAdapter } from './adapters/supabase-adapter';
import { PostgreSQLServerAdapter } from './server-adapters/postgresql-server-adapter';
import { MySQLServerAdapter } from './server-adapters/mysql-server-adapter';

/**
 * Gestionnaire de base de données pour le côté serveur
 * Utilise les vrais adaptateurs avec connexions réelles
 */
class ServerDatabaseManagerImpl implements DatabaseManager {
  private currentAdapter: DatabaseAdapter | null = null;
  private activeConfig: DatabaseConfig | null = null;

  constructor() {
    // Charger la configuration par défaut (Supabase)
    this.loadDefaultConfig();
  }

  getCurrentAdapter(): DatabaseAdapter {
    if (!this.currentAdapter) {
      const defaultConfig: DatabaseConfig = {
        type: 'supabase',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
        name: 'Supabase Production',
        isActive: true
      };
      
      this.currentAdapter = this.createAdapter(defaultConfig);
      this.activeConfig = defaultConfig;
    }
    
    return this.currentAdapter;
  }

  async switchDatabase(config: DatabaseConfig): Promise<boolean> {
    try {
      console.log('🔄 Switch serveur vers base de données:', config.type, config.name);

      // Déconnecter l'adaptateur actuel
      if (this.currentAdapter) {
        await this.currentAdapter.disconnect();
      }

      // Créer le nouvel adaptateur
      const newAdapter = this.createAdapter(config);
      
      // Tester la connexion
      const connected = await newAdapter.connect();
      
      if (!connected) {
        throw new Error('Impossible de se connecter à la nouvelle base de données');
      }

      // Test de fonctionnement
      const testResult = await newAdapter.testConnection();
      if (!testResult) {
        throw new Error('Test de connexion échoué');
      }

      // Sauvegarder la nouvelle configuration
      this.currentAdapter = newAdapter;
      this.activeConfig = { ...config, isActive: true, lastTested: new Date().toISOString() };

      console.log('✅ Switch serveur base de données réussi');
      return true;
    } catch (error) {
      console.error('❌ Erreur switch serveur base de données:', error);
      return false;
    }
  }

  getActiveConfig(): DatabaseConfig | null {
    return this.activeConfig;
  }

  async testConfig(config: DatabaseConfig): Promise<boolean> {
    try {
      console.log('🧪 Test serveur configuration:', config.type, config.name);
      
      const testAdapter = this.createAdapter(config);
      const result = await testAdapter.testConnection();
      await testAdapter.disconnect();
      
      console.log(result ? '✅ Test serveur réussi' : '❌ Test serveur échoué');
      return result;
    } catch (error) {
      console.error('❌ Erreur test serveur configuration:', error);
      return false;
    }
  }

  private createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'supabase':
        return new SupabaseAdapter(config);
      case 'postgresql':
        return new PostgreSQLServerAdapter(config);
      case 'mysql':
        return new MySQLServerAdapter(config);
      default:
        throw new Error(`Type de base de données non supporté: ${config.type}`);
    }
  }

  private loadDefaultConfig(): void {
    // Configuration par défaut Supabase
    this.activeConfig = {
      type: 'supabase',
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
      name: 'Supabase Production',
      isActive: true
    };
    console.log('📂 Configuration serveur par défaut chargée:', this.activeConfig.type);
  }

  // Méthodes utilitaires
  async getAvailableSchemas(): Promise<string[]> {
    const adapter = this.getCurrentAdapter();
    return await adapter.getSchemas();
  }

  async executeQuery(sql: string, params?: any[]) {
    const adapter = this.getCurrentAdapter();
    return await adapter.query(sql, params);
  }

  async executeRPC(functionName: string, params: Record<string, any>) {
    const adapter = this.getCurrentAdapter();
    return await adapter.executeRPC(functionName, params);
  }
}

// Instance singleton pour le serveur
export const serverDatabaseManager = new ServerDatabaseManagerImpl();

// Export pour utilisation dans les API routes
export { ServerDatabaseManagerImpl };
export type { DatabaseConfig, DatabaseAdapter };