import { DatabaseConfig } from './types';
import { getApiUrl } from '@/lib/api';

/**
 * Service pour synchroniser la configuration de base de données entre frontend et backend
 */
export class DatabaseSyncService {
  
  /**
   * Synchronise la configuration de base de données avec le backend
   */
  static async syncDatabaseConfig(config: DatabaseConfig): Promise<boolean> {
    try {
      console.log('🔄 Synchronizing database config with backend:', config.type, config.name);
      
      // Envoyer la configuration au backend
      const response = await fetch('http://localhost:3005/api/database-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Backend database config synchronized:', result.message);
        return true;
      } else {
        console.error('❌ Backend database config sync failed:', result.error);
        return false;
      }
    } catch (error) {
      console.error('❌ Error synchronizing database config:', error);
      return false;
    }
  }
  
  /**
   * Vérifie si le frontend et le backend utilisent la même base de données
   */
  static async checkDatabaseSync(): Promise<{
    synced: boolean;
    frontendType: string;
    backendType: string;
  }> {
    try {
      // Obtenir le type de base de données du frontend
      const frontendResponse = await fetch(getApiUrl('database-type'));
      const frontendData = await frontendResponse.json();
      const frontendType = frontendData.success ? frontendData.data.type : 'unknown';
      
      // Obtenir le type de base de données du backend
      const backendResponse = await fetch('http://localhost:3005/api/database-config');
      const backendData = await backendResponse.json();
      const backendType = backendData.success ? backendData.data.type : 'unknown';
      
      const synced = frontendType === backendType;
      
      console.log(`🔍 Database sync check: Frontend=${frontendType}, Backend=${backendType}, Synced=${synced}`);
      
      return {
        synced,
        frontendType,
        backendType
      };
    } catch (error) {
      console.error('❌ Error checking database sync:', error);
      return {
        synced: false,
        frontendType: 'unknown',
        backendType: 'unknown'
      };
    }
  }
  
  /**
   * Force la synchronisation en envoyant la configuration frontend au backend
   */
  static async forceSyncFromFrontend(): Promise<boolean> {
    try {
      // Obtenir la configuration active du frontend
      const activeConfig = localStorage.getItem('activeDbConfig');
      if (!activeConfig) {
        console.warn('⚠️ No active database config found in frontend');
        return false;
      }
      
      const config: DatabaseConfig = JSON.parse(activeConfig);
      return await this.syncDatabaseConfig(config);
    } catch (error) {
      console.error('❌ Error force syncing from frontend:', error);
      return false;
    }
  }
}

/**
 * Hook pour écouter les changements de configuration de base de données
 * et synchroniser automatiquement avec le backend
 */
export function setupDatabaseSyncListener(): void {
  if (typeof window === 'undefined') return;
  
  // Écouter les changements de localStorage
  const handleStorageChange = async (e: StorageEvent) => {
    if (e.key === 'activeDbConfig' && e.newValue) {
      try {
        const newConfig: DatabaseConfig = JSON.parse(e.newValue);
        console.log('🔄 Database config changed, syncing with backend...');
        
        const success = await DatabaseSyncService.syncDatabaseConfig(newConfig);
        if (success) {
          console.log('✅ Database config synchronized with backend');
        } else {
          console.warn('⚠️ Failed to synchronize database config with backend');
        }
      } catch (error) {
        console.error('❌ Error handling database config change:', error);
      }
    }
  };
  
  window.addEventListener('storage', handleStorageChange);
  
  // Synchronisation initiale
  setTimeout(() => {
    DatabaseSyncService.forceSyncFromFrontend();
  }, 1000);
  
  console.log('🎧 Database sync listener setup complete');
}