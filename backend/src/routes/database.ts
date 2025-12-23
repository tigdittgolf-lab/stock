import { Hono } from 'hono';
import { backendDatabaseService } from '../services/databaseService.js';

const database = new Hono();

/**
 * API pour changer la base de données active
 */
database.post('/switch', async (c) => {
  try {
    const { type, config } = await c.req.json();
    
    console.log('🔄 Backend: Switch database request:', type, config?.name || 'unnamed');

    // Valider le type de base de données
    if (!['supabase', 'mysql', 'postgresql'].includes(type)) {
      return c.json({ 
        success: false, 
        error: `Type de base de données non supporté: ${type}` 
      }, 400);
    }

    // Utiliser le service de base de données existant
    const switchResult = await backendDatabaseService.switchDatabase({
      type: type as any,
      name: config?.name || `${type} database`,
      host: config?.host,
      port: config?.port,
      database: config?.database,
      username: config?.username,
      password: config?.password,
      supabaseUrl: config?.supabaseUrl,
      supabaseKey: config?.supabaseKey
    });

    if (!switchResult) {
      return c.json({
        success: false,
        error: 'Failed to switch database'
      }, 500);
    }

    // Tester la nouvelle configuration
    try {
      const testResult = await backendDatabaseService.executeRPC('get_articles_by_tenant', { p_tenant: '2025_bu01' });
      console.log('🧪 Test nouvelle configuration:', testResult.success ? 'OK' : 'FAILED');
    } catch (testError) {
      console.warn('⚠️ Test configuration échoué:', testError);
    }

    return c.json({
      success: true,
      message: `Base de données changée vers ${type}`,
      currentType: backendDatabaseService.getActiveDatabaseType(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur switch database backend:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur switch database'
    }, 500);
  }
});

/**
 * API pour obtenir le type de base de données actuel
 */
database.get('/current', async (c) => {
  try {
    return c.json({
      success: true,
      currentType: backendDatabaseService.getActiveDatabaseType(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erreur get current database:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur get current database'
    }, 500);
  }
});

export default database;