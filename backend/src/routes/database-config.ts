import { Hono } from 'hono';
import { backendDatabaseService, DatabaseConfig } from '../services/databaseService.js';

const databaseConfig = new Hono();

// GET /api/database-config - Get current database configuration
databaseConfig.get('/', async (c) => {
  try {
    const dbType = backendDatabaseService.getActiveDatabaseType();
    
    return c.json({
      success: true,
      data: {
        type: dbType,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error getting database config:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

// POST /api/database-config - Switch database configuration
databaseConfig.post('/', async (c) => {
  try {
    const config: DatabaseConfig = await c.req.json();
    
    console.log(`🔄 Backend received database switch request:`, config.type, config.name);
    
    const success = await backendDatabaseService.switchDatabase(config);
    
    if (success) {
      return c.json({
        success: true,
        message: `Backend switched to ${config.type} (${config.name})`,
        data: {
          type: config.type,
          name: config.name,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return c.json({
        success: false,
        error: `Failed to switch backend to ${config.type}`
      }, 500);
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