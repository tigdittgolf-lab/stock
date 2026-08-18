import { Hono } from 'hono';
import { backendDatabaseService, DatabaseConfig } from '../services/databaseService.js';
import { requireAdminLocal } from '../middleware/authMiddleware.js';

const databaseConfig = new Hono();

// Sanitisation : ne jamais renvoyer les secrets (password, supabaseKey) au frontend
function sanitizeConfig(cfg: DatabaseConfig | undefined): any | null {
  if (!cfg) return null;
  const { password, supabaseKey, ...safe } = cfg as any;
  return safe;
}

// GET /api/database-config - Config actuelle (sans secrets)
databaseConfig.get('/', async (c) => {
  try {
    const cfg = backendDatabaseService.getActiveConfig();
    return c.json({
      success: true,
      data: cfg ? sanitizeConfig(cfg) : null,
      type: backendDatabaseService.getActiveDatabaseType(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting database config:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/database-config/test - Teste une configuration SANS la sauvegarder (admin)
databaseConfig.post('/test', requireAdminLocal, async (c) => {
  try {
    const body = await c.req.json();
    const config: DatabaseConfig = body.config || body;

    if (!config || !config.type) {
      return c.json({ success: false, error: "Type de base requis (supabase, mysql, postgresql)" }, 400);
    }

    // Pour Supabase, compléter avec les infos d'environnement si absentes
    if (config.type === 'supabase') {
      config.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
      config.supabaseKey = config.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    console.log(`🔌 Test de connexion vers: ${config.type} (${config.name || ''})`);

    const testResult = await backendDatabaseService.testDatabaseConnection(config);

    if (testResult) {
      return c.json({ success: true, message: `Connexion ${config.type} réussie`, config: sanitizeConfig(config) });
    } else {
      return c.json({ success: false, error: `Impossible de se connecter à ${config.type}. Vérifiez les paramètres.` }, 400);
    }
  } catch (error) {
    console.error('Error testing database config:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/database-config/switch - Change la base ACTIVE et persistante (admin)
databaseConfig.post('/switch', requireAdminLocal, async (c) => {
  try {
    const body = await c.req.json();
    const { database, config } = body;

    console.log(`🔄 (admin) Changement de base vers: ${database || config?.type}`);

    if (config && config.type) {
      const success = await backendDatabaseService.switchDatabase(config);
      if (!success) {
        return c.json({ success: false, error: `Échec de la connexion à ${config.type}` }, 400);
      }
      return c.json({
        success: true,
        message: `Base changée avec succès`,
        data: sanitizeConfig(backendDatabaseService.getActiveConfig()),
        timestamp: new Date().toISOString()
      });
    }

    // Mapping simple : nom -> config
    const configs: Record<string, DatabaseConfig> = {
      'supabase': {
        type: 'supabase',
        name: 'Supabase Cloud',
        supabaseUrl: process.env.SUPABASE_URL || 'https://szgodrjglbpzkrksnroi.supabase.co',
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      'mysql': {
        type: 'mysql',
        name: 'MySQL Local',
        host: process.env.MYSQL_HOST || 'localhost',
        port: parseInt(process.env.MYSQL_PORT || '3306'),
        database: process.env.MYSQL_DATABASE || 'stock_management',
        username: process.env.MYSQL_USER || 'root',
        password: process.env.MYSQL_PASSWORD || ''
      },
      'postgresql': {
        type: 'postgresql',
        name: 'PostgreSQL Local',
        host: process.env.POSTGRES_HOST || 'localhost',
        port: parseInt(process.env.POSTGRES_PORT || '5432'),
        database: process.env.POSTGRES_DATABASE || 'stock_management',
        username: process.env.POSTGRES_USER || 'postgres',
        password: process.env.POSTGRES_PASSWORD || 'postgres'
      }
    };

    const selectedConfig = configs[database as keyof typeof configs];
    if (!selectedConfig) {
      return c.json({ success: false, error: `Type de base ${database} inconnu. Utiliser: supabase, mysql, postgresql` }, 400);
    }

    const success = await backendDatabaseService.switchDatabase(selectedConfig);
    if (!success) {
      return c.json({ success: false, error: `Échec de la connexion vers ${database}` }, 400);
    }

    return c.json({
      success: true,
      message: `Base changée sur supabase ${database}`,
      data: sanitizeConfig(backendDatabaseService.getActiveConfig()),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error switching database:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/database-config - Ancien endpoint de switch (admin), conservé pour rétrocompatibilité
databaseConfig.post('/', requireAdminLocal, async (c) => {
  try {
    const config: DatabaseConfig = await c.req.json();

    if (!config || !config.type) {
      return c.json({ success: false, error: "Type de connexion requis (supabase, mysql, postgresql)" }, 400);
    }

    if (config.type === 'supabase') {
      config.supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
      config.supabaseKey = config.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
    }

    const success = await backendDatabaseService.switchDatabase(config);

    if (success) {
      return c.json({
        success: true,
        message: `Backend switched to ${config.type} (${config.name})`,
        data: sanitizeConfig(backendDatabaseService.getActiveConfig()),
        timestamp: new Date().toISOString()
      });
    } else {
      return c.json({
        success: false,
        error: `Failed to switch backend to ${config.type}`
      }, 400);
    }
  } catch (error) {
    console.error('Error switching database config:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default databaseConfig;