import { Hono } from 'hono';
import { MigrationManager } from '../migrations/migration-manager';

const app = new Hono();

// Configuration MySQL
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');

/**
 * GET /api/migrations/status
 * Obtenir le statut des migrations pour toutes les bases
 */
app.get('/status', async (c) => {
  const manager = new MigrationManager(
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_PORT
  );

  try {
    await manager.connect();
    const status = await manager.getMigrationStatus();
    await manager.disconnect();

    return c.json({
      success: true,
      data: status
    });
  } catch (error) {
    console.error('❌ Erreur récupération statut migrations:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * POST /api/migrations/apply
 * Appliquer les migrations
 * Body: { database?: string, dryRun?: boolean }
 */
app.post('/apply', async (c) => {
  const body = await c.req.json();
  const { database, dryRun = false } = body;

  const manager = new MigrationManager(
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_PORT
  );

  try {
    await manager.connect();

    if (dryRun) {
      // Mode simulation: juste afficher ce qui serait fait
      const status = await manager.getMigrationStatus();
      const pending: any = {};

      for (const [db, info] of Object.entries(status as any)) {
        if (info.pending > 0) {
          pending[db] = info.migrations.filter((m: any) => !m.applied);
        }
      }

      await manager.disconnect();

      return c.json({
        success: true,
        dryRun: true,
        data: pending,
        message: 'Simulation - Aucune migration appliquée'
      });
    }

    // Appliquer réellement les migrations
    const results = await manager.applyAllMigrations(database);
    await manager.disconnect();

    // Statistiques
    const stats = {
      total: results.length,
      success: results.filter(r => r.success && r.error !== 'Déjà appliquée').length,
      skipped: results.filter(r => r.success && r.error === 'Déjà appliquée').length,
      failed: results.filter(r => !r.success).length,
      errors: results.filter(r => !r.success).map(r => ({
        database: r.database,
        version: r.version,
        error: r.error
      }))
    };

    return c.json({
      success: stats.failed === 0,
      data: {
        results,
        stats
      },
      message: stats.failed === 0
        ? 'Migrations appliquées avec succès'
        : 'Certaines migrations ont échoué'
    });
  } catch (error) {
    console.error('❌ Erreur application migrations:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

/**
 * GET /api/migrations/databases
 * Lister toutes les bases de données
 */
app.get('/databases', async (c) => {
  const manager = new MigrationManager(
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_PORT
  );

  try {
    await manager.connect();
    const databases = await manager.getAllDatabases();
    await manager.disconnect();

    return c.json({
      success: true,
      data: databases
    });
  } catch (error) {
    console.error('❌ Erreur récupération bases:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

export default app;
