import { databaseManager } from './database-manager';
import { createClient } from '@supabase/supabase-js';

/**
 * Service unifié pour l'accès aux données
 * Utilise automatiquement l'adaptateur de base de données actif
 */
export class DatabaseService {
  
  /**
   * Exécute une fonction RPC selon l'adaptateur actif
   */
  static async executeRPC(functionName: string, params: Record<string, any>) {
    try {
      const adapter = databaseManager.getCurrentAdapter();
      return await adapter.executeRPC(functionName, params);
    } catch (error) {
      console.error('Erreur DatabaseService.executeRPC:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Exécute une requête SQL directe (pour les adaptateurs locaux)
   */
  static async executeQuery(sql: string, params?: any[]) {
    try {
      const adapter = databaseManager.getCurrentAdapter();
      return await adapter.query(sql, params);
    } catch (error) {
      console.error('Erreur DatabaseService.executeQuery:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  /**
   * Obtient la liste des schémas disponibles
   */
  static async getAvailableSchemas(): Promise<string[]> {
    try {
      const adapter = databaseManager.getCurrentAdapter();
      return await adapter.getSchemas();
    } catch (error) {
      console.error('Erreur DatabaseService.getAvailableSchemas:', error);
      return [];
    }
  }

  /**
   * Obtient le client Supabase si l'adaptateur actif est Supabase
   */
  static getSupabaseClient() {
    const adapter = databaseManager.getCurrentAdapter();
    
    // Vérifier si c'est un SupabaseAdapter
    if ('getClient' in adapter) {
      return (adapter as any).getClient();
    }
    
    // Fallback vers le client par défaut
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    );
  }

  /**
   * Vérifie si la base de données actuelle est Supabase
   */
  static isSupabaseActive(): boolean {
    const config = databaseManager.getActiveConfig();
    return config?.type === 'supabase';
  }

  /**
   * Vérifie si la base de données actuelle est locale (PostgreSQL ou MySQL)
   */
  static isLocalDatabaseActive(): boolean {
    const config = databaseManager.getActiveConfig();
    return config?.type === 'postgresql' || config?.type === 'mysql';
  }

  /**
   * Obtient le type de base de données active
   */
  static getActiveDatabaseType(): string {
    const config = databaseManager.getActiveConfig();
    return config?.type || 'supabase';
  }

  /**
   * Méthode utilitaire pour les API routes
   * Remplace les appels directs à Supabase
   */
  static async apiCall(functionName: string, params: Record<string, any>) {
    const result = await this.executeRPC(functionName, params);
    
    if (!result.success) {
      throw new Error(result.error || 'Erreur base de données');
    }
    
    return result.data;
  }

  /**
   * Migration de données entre bases (prototype)
   */
  static async migrateData(sourceConfig: any, targetConfig: any): Promise<boolean> {
    console.log('🔄 Migration de données:', sourceConfig.type, '→', targetConfig.type);
    
    // TODO: Implémenter la migration réelle
    // 1. Connecter aux deux bases
    // 2. Extraire les données de la source
    // 3. Créer les schémas dans la cible
    // 4. Insérer les données dans la cible
    // 5. Vérifier l'intégrité
    
    return true;
  }

  /**
   * Synchronisation bidirectionnelle (prototype)
   */
  static async syncDatabases(): Promise<boolean> {
    console.log('🔄 Synchronisation des bases de données');
    
    // TODO: Implémenter la synchronisation
    // 1. Détecter les changements dans chaque base
    // 2. Résoudre les conflits
    // 3. Appliquer les changements
    
    return true;
  }
}

// Export pour compatibilité
export { databaseManager };