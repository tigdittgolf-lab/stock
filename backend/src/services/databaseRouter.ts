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
        // Pour authenticate_user, le résultat est dans result.user
        // Pour les autres fonctions, le résultat est dans result.data
        const data = result.data !== undefined ? result.data : result.user || result;
        return {
          data: data,
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
   * Implémentation complète pour supporter MySQL, PostgreSQL et Supabase
   */
  from(table: string) {
    const dbType = backendDatabaseService.getActiveDatabaseType();
    
    return {
      select: (columns: string = '*') => {
        let whereConditions: string[] = [];
        let orderByClause = '';
        let limitClause = '';
        
        const queryBuilder = {
          eq: function(column: string, value: any) {
            whereConditions.push(`${column} = '${value}'`);
            return queryBuilder;
          },
          order: function(column: string, options?: { ascending?: boolean }) {
            const direction = options?.ascending === false ? 'DESC' : 'ASC';
            orderByClause = ` ORDER BY ${column} ${direction}`;
            return queryBuilder;
          },
          limit: function(count: number) {
            limitClause = ` LIMIT ${count}`;
            return queryBuilder;
          },
          single: async function() {
            if (dbType === 'supabase') {
              let supabaseQuery = supabaseAdmin.from(table).select(columns);
              whereConditions.forEach(condition => {
                const match = condition.match(/(\w+) = '(.*)'/);
                if (match) {
                  supabaseQuery = supabaseQuery.eq(match[1], match[2]);
                }
              });
              return await supabaseQuery.single();
            } else {
              const query = `SELECT ${columns} FROM ${table}` + 
                (whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '') +
                orderByClause + 
                ' LIMIT 1';
              
              const result = await backendDatabaseService.executeQuery(query, []);
              if (result.success && result.data && result.data.length > 0) {
                return { data: result.data[0], error: null };
              }
              return { data: null, error: { message: 'No data found' } };
            }
          }
        };
        
        // Créer une fonction async qui retourne la Promise
        const executeQuery = async () => {
          if (dbType === 'supabase') {
            let supabaseQuery = supabaseAdmin.from(table).select(columns);
            whereConditions.forEach(condition => {
              const match = condition.match(/(\w+) = '(.*)'/);
              if (match) {
                supabaseQuery = supabaseQuery.eq(match[1], match[2]);
              }
            });
            if (orderByClause) {
              const match = orderByClause.match(/ORDER BY (\w+) (\w+)/);
              if (match) {
                supabaseQuery = supabaseQuery.order(match[1], { ascending: match[2] === 'ASC' });
              }
            }
            if (limitClause) {
              const match = limitClause.match(/LIMIT (\d+)/);
              if (match) {
                supabaseQuery = supabaseQuery.limit(parseInt(match[1]));
              }
            }
            return await supabaseQuery;
          } else {
            const query = `SELECT ${columns} FROM ${table}` + 
              (whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '') +
              orderByClause + 
              limitClause;
            
            console.log(`🔍 DatabaseRouter query: ${query}`);
            const result = await backendDatabaseService.executeQuery(query, []);
            if (result.success) {
              return { data: result.data, error: null };
            }
            return { data: null, error: { message: result.error } };
          }
        };
        
        // Retourner un objet qui a à la fois les méthodes du builder ET then/catch
        return Object.assign(executeQuery(), queryBuilder);
      },
      
      insert: (data: any | any[]) => {
        const queryBuilder = {
          select: function() { return queryBuilder; },
          single: async function() {
            if (dbType === 'supabase') {
              return await supabaseAdmin.from(table).insert(data).select().single();
            } else {
              const records = Array.isArray(data) ? data : [data];
              const keys = Object.keys(records[0]);
              const values = records.map(record => 
                `(${keys.map(k => {
                  const val = record[k];
                  if (val === null || val === undefined) return 'NULL';
                  if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                  return val;
                }).join(', ')})`
              ).join(', ');
              
              const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${values}`;
              const result = await backendDatabaseService.executeQuery(query, []);
              
              if (result.success) {
                return { data: records[0], error: null };
              }
              return { data: null, error: { message: result.error } };
            }
          }
        };
        
        const executeQuery = async () => {
          if (dbType === 'supabase') {
            return await supabaseAdmin.from(table).insert(data).select();
          } else {
            const records = Array.isArray(data) ? data : [data];
            const keys = Object.keys(records[0]);
            const values = records.map(record => 
              `(${keys.map(k => {
                const val = record[k];
                if (val === null || val === undefined) return 'NULL';
                if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
                return val;
              }).join(', ')})`
            ).join(', ');
            
            const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES ${values}`;
            const result = await backendDatabaseService.executeQuery(query, []);
            
            if (result.success) {
              return { data: records, error: null };
            }
            return { data: null, error: { message: result.error } };
          }
        };
        
        return Object.assign(executeQuery(), queryBuilder);
      },
      
      update: (data: any) => {
        let whereConditions: string[] = [];
        
        const queryBuilder = {
          eq: function(column: string, value: any) {
            whereConditions.push(`${column} = '${value}'`);
            return queryBuilder;
          }
        };
        
        const executeQuery = async () => {
          if (dbType === 'supabase') {
            let supabaseQuery = supabaseAdmin.from(table).update(data);
            whereConditions.forEach(condition => {
              const match = condition.match(/(\w+) = '(.*)'/);
              if (match) {
                supabaseQuery = supabaseQuery.eq(match[1], match[2]);
              }
            });
            return await supabaseQuery;
          } else {
            const setClause = Object.keys(data)
              .map(key => {
                const val = data[key];
                if (val === null || val === undefined) return `${key} = NULL`;
                if (typeof val === 'string') return `${key} = '${val.replace(/'/g, "''")}'`;
                return `${key} = ${val}`;
              })
              .join(', ');
            
            const query = `UPDATE ${table} SET ${setClause}` +
              (whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '');
            
            const result = await backendDatabaseService.executeQuery(query, []);
            
            if (result.success) {
              return { data: result.data, error: null };
            }
            return { data: null, error: { message: result.error } };
          }
        };
        
        return Object.assign(executeQuery(), queryBuilder);
      },
      
      delete: () => {
        let whereConditions: string[] = [];
        
        const queryBuilder = {
          eq: function(column: string, value: any) {
            whereConditions.push(`${column} = '${value}'`);
            return queryBuilder;
          }
        };
        
        const executeQuery = async () => {
          if (dbType === 'supabase') {
            let supabaseQuery = supabaseAdmin.from(table).delete();
            whereConditions.forEach(condition => {
              const match = condition.match(/(\w+) = '(.*)'/);
              if (match) {
                supabaseQuery = supabaseQuery.eq(match[1], match[2]);
              }
            });
            return await supabaseQuery;
          } else {
            const query = `DELETE FROM ${table}` +
              (whereConditions.length > 0 ? ' WHERE ' + whereConditions.join(' AND ') : '');
            
            const result = await backendDatabaseService.executeQuery(query, []);
            
            if (result.success) {
              return { data: result.data, error: null };
            }
            return { data: null, error: { message: result.error } };
          }
        };
        
        return Object.assign(executeQuery(), queryBuilder);
      }
    };
  }
}

// Export de l'instance singleton qui remplace supabaseAdmin
export const databaseRouter = DatabaseRouter.getInstance();

// Export pour compatibilité avec l'import existant
export default databaseRouter;