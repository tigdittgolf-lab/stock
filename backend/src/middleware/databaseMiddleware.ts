import { Context, Next } from 'hono';
import { backendDatabaseService } from '../services/databaseService.js';

/**
 * Middleware pour configurer la base de données selon l'en-tête X-Database-Type
 * Ce middleware s'exécute AVANT chaque requête et configure la bonne base
 */
export async function databaseMiddleware(c: Context, next: Next) {
  const dbType = c.req.header('X-Database-Type') || 'mysql'; // CHANGÉ: mysql par défaut
  
  console.log(`🔀 [Middleware] Database Type: ${dbType}`);

  // Configuration des bases de données
  const dbConfigs: Record<string, any> = {
    supabase: {
      type: 'supabase',
      name: 'Supabase Cloud',
      supabaseUrl: process.env.SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
      supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    mysql: {
      type: 'mysql',
      name: 'MySQL Local',
      host: process.env.MYSQL_HOST || 'localhost',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      database: process.env.MYSQL_DATABASE || 'stock_management',
      username: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || ''
    },
    postgresql: {
      type: 'postgresql',
      name: 'PostgreSQL Local',
      host: process.env.POSTGRES_HOST || 'localhost',
      port: parseInt(process.env.POSTGRES_PORT || '5432'),
      database: process.env.POSTGRES_DATABASE || 'stock_management',
      username: process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD || 'postgres'
    }
  };

  const dbConfig = dbConfigs[dbType];
  
  if (dbConfig) {
    try {
      // Changer la base de données active pour cette requête
      const switched = await backendDatabaseService.switchDatabase(dbConfig);
      
      if (switched) {
        console.log(`✅ [Middleware] Switched to ${dbConfig.name}`);
      } else {
        console.warn(`⚠️ [Middleware] Failed to switch to ${dbConfig.name}, using current database`);
      }
    } catch (error) {
      console.error(`❌ [Middleware] Error switching database:`, error);
      // Continue avec la base actuelle en cas d'erreur
    }
  }

  await next();
}
