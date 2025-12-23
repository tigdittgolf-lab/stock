import { DatabaseManager, DatabaseAdapter, DatabaseConfig } from './types';
import { SupabaseAdapter } from './adapters/supabase-adapter';
import { PostgreSQLAdapter } from './adapters/postgresql-adapter';
import { MySQLAdapter } from './adapters/mysql-adapter';

class DatabaseManagerImpl implements DatabaseManager {
  private currentAdapter: DatabaseAdapter | null = null;
  private activeConfig: DatabaseConfig | null = null;

  constructor() {
    // Charger la configuration active au démarrage
    this.loadActiveConfig();
  }

  getCurrentAdapter(): DatabaseAdapter {
    if (!this.currentAdapter) {
      // Configuration par défaut (Supabase actuel)
      const defaultConfig: DatabaseConfig = {
        type: 'supabase',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg',
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
      console.log('🔄 Switch vers base de données:', config.type, config.name);

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

      // NOUVEAU: Notifier le backend du changement
      try {
        const backendResponse = await fetch('http://localhost:3000/api/database/switch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: config.type,
            config: config
          })
        });

        if (backendResponse.ok) {
          const backendResult = await backendResponse.json();
          console.log('✅ Backend notifié du changement:', backendResult);
        } else {
          console.warn('⚠️ Erreur notification backend:', backendResponse.status);
        }
      } catch (backendError) {
        console.warn('⚠️ Impossible de notifier le backend:', backendError);
        // Ne pas échouer le switch si le backend n'est pas accessible
      }

      // Sauvegarder la nouvelle configuration
      this.currentAdapter = newAdapter;
      this.activeConfig = { ...config, isActive: true, lastTested: new Date().toISOString() };
      this.saveActiveConfig();

      console.log('✅ Switch base de données réussi');
      return true;
    } catch (error) {
      console.error('❌ Erreur switch base de données:', error);
      return false;
    }
  }

  getActiveConfig(): DatabaseConfig | null {
    return this.activeConfig;
  }

  async testConfig(config: DatabaseConfig): Promise<boolean> {
    try {
      console.log('🧪 Test configuration:', config.type, config.name);
      
      const testAdapter = this.createAdapter(config);
      const result = await testAdapter.testConnection();
      await testAdapter.disconnect();
      
      console.log(result ? '✅ Test réussi' : '❌ Test échoué');
      return result;
    } catch (error) {
      console.error('❌ Erreur test configuration:', error);
      return false;
    }
  }

  private createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'supabase':
        return new SupabaseAdapter(config);
      case 'postgresql':
        return new PostgreSQLAdapter(config);
      case 'mysql':
        return new MySQLAdapter(config);
      default:
        throw new Error(`Type de base de données non supporté: ${config.type}`);
    }
  }

  private loadActiveConfig(): void {
    try {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('activeDbConfig');
        if (saved) {
          this.activeConfig = JSON.parse(saved);
          console.log('📂 Configuration chargée:', this.activeConfig?.type, this.activeConfig?.name);
        }
      }
    } catch (error) {
      console.error('Erreur chargement configuration:', error);
    }
  }

  private saveActiveConfig(): void {
    try {
      if (typeof window !== 'undefined' && this.activeConfig) {
        localStorage.setItem('activeDbConfig', JSON.stringify(this.activeConfig));
        console.log('💾 Configuration sauvegardée');
      }
    } catch (error) {
      console.error('Erreur sauvegarde configuration:', error);
    }
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

// Instance singleton
export const databaseManager = new DatabaseManagerImpl();

// Export pour utilisation dans les composants
export { DatabaseManagerImpl };
export type { DatabaseConfig, DatabaseAdapter };