import { backendDatabaseService } from './databaseService.js';
import { supabaseAdmin } from '../supabaseClient.js';

/**
 * ROUTEUR DE BASE DE DONNÉES CENTRALISÉ
 * 
 * Ce service remplace complètement supabaseAdmin dans toutes les routes.
 * Il route automatiquement vers la base de données active (Supabase/MySQL/PostgreSQL)
 * de manière TRANSPARENTE pour l'utilisateur final.
 * 
 * Usage: Remplacer `supabaseAdmin.rpc(...)` par `databaseRouter.rpc(...)`
 */
export class DatabaseRouter {
  private static instance: DatabaseRouter;

  private constructor() {}

  static getInstance(): DatabaseRouter {
    if (!DatabaseRouter.instance) {
      DatabaseRouter.instance = new DatabaseRouter();
    }
    return DatabaseRouter.instance;
  }

  /**
   * Méthode principale qui remplace supabaseAdmin.rpc()
   * Route automatiquement vers la base de données active
   */
  async rpc(functionName: string, params: Record<string, any> = {}): Promise<{data: any, error: any}> {
    try {
      const dbType = backendDatabaseService.getActiveDatabaseType();
      console.log(`🔀 DatabaseRouter: ${functionName} → ${dbType}`);

      // Router vers la base de données active
      const result = await backendDatabaseService.executeRPC(functionName, params);
      
      if (result.success) {
        return {
          data: result.data,
          error: null
        };
      } else {
        return {
          data: null,
          error: { message: result.error }
        };
      }
    } catch (error) {
      console.error(`❌ DatabaseRouter error for ${functionName}:`, error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'Database router error' }
      };
    }
  }

  /**
   * Méthode pour les requêtes SQL directes (exec_sql)
   * Convertit automatiquement selon la base de données
   */
  async execSql(sql: string): Promise<{data: any, error: any}> {
    try {
      const dbType = backendDatabaseService.getActiveDatabaseType();
      console.log(`🔀 DatabaseRouter SQL: ${sql.substring(0, 50)}... → ${dbType}`);

      if (dbType === 'supabase') {
        // Pour Supabase, utiliser la fonction exec_sql
        const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql });
        return { data, error };
      } else {
        // Pour MySQL/PostgreSQL, exécuter directement
        const result = await backendDatabaseService.executeQuery(sql);
        
        if (result.success) {
          return {
            data: result.data,
            error: null
          };
        } else {
          return {
            data: null,
            error: { message: result.error }
          };
        }
      }
    } catch (error) {
      console.error(`❌ DatabaseRouter SQL error:`, error);
      return {
        data: null,
        error: { message: error instanceof Error ? error.message : 'SQL execution error' }
      };
    }
  }

  /**
   * Méthode pour maintenir la compatibilité avec l'API Supabase
   */
  from(table: string) {
    // Cette méthode n'est pas utilisée dans notre architecture RPC
    // Mais on la garde pour la compatibilité
    return {
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: [], error: null }),
      update: () => ({ data: [], error: null }),
      delete: () => ({ data: [], error: null })
    };
  }
}

// Export de l'instance singleton qui remplace supabaseAdmin
export const databaseRouter = DatabaseRouter.getInstance();

// Export pour compatibilité avec l'import existant
export default databaseRouter;