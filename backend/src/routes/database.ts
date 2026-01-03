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

/**
 * API pour tester une configuration de base de données
 */
database.post('/test', async (c) => {
  try {
    const config = await c.req.json();
    
    console.log('🧪 Backend: Test database connection:', config.type, config.name || 'unnamed');

    // Valider le type de base de données
    if (!['supabase', 'mysql', 'postgresql'].includes(config.type)) {
      return c.json({ 
        success: false, 
        error: `Type de base de données non supporté: ${config.type}` 
      }, 400);
    }

    // Créer une instance temporaire pour tester
    let testResult;
    
    if (config.type === 'supabase') {
      // Test Supabase
      try {
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseUrl = config.supabaseUrl || process.env.SUPABASE_URL;
        const supabaseKey = config.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!supabaseUrl || !supabaseKey) {
          return c.json({
            success: false,
            error: 'URL Supabase ou clé manquante'
          }, 400);
        }

        // Test de connectivité réseau d'abord
        console.log(`🌐 Test de connectivité vers: ${supabaseUrl}`);
        
        try {
          // Test simple avec fetch pour vérifier la connectivité
          const testResponse = await fetch(supabaseUrl, { 
            method: 'HEAD',
            signal: AbortSignal.timeout(10000) // Timeout de 10 secondes
          });
          console.log(`🌐 Connectivité réseau OK - Status: ${testResponse.status}`);
        } catch (networkError) {
          console.error(`❌ Erreur de connectivité réseau:`, networkError.message);
          return c.json({
            success: false,
            error: `Impossible de se connecter à Supabase: ${networkError.message}. Vérifiez votre connexion Internet et l'URL Supabase.`
          });
        }

        const testClient = createClient(supabaseUrl, supabaseKey);
        
        // Test simple avec une requête RPC
        const { data, error } = await testClient.rpc('get_articles_by_tenant', { 
          p_tenant: '2025_bu01' 
        });
        
        if (error) {
          console.warn('⚠️ Test Supabase warning:', error.message);
          // Même si la fonction RPC n'existe pas, la connexion fonctionne
          if (error.message.includes('function') || error.message.includes('does not exist')) {
            testResult = { success: true, message: 'Connexion Supabase OK (fonction RPC non trouvée mais connexion valide)' };
          } else if (error.message.includes('connect') || error.message.includes('network') || error.message.includes('timeout')) {
            testResult = { success: false, error: `Erreur de connexion Supabase: ${error.message}` };
          } else {
            testResult = { success: false, error: error.message };
          }
        } else {
          testResult = { success: true, message: 'Connexion Supabase OK', data: data?.length || 0 };
        }
        
      } catch (error) {
        console.error('❌ Erreur test Supabase:', error);
        testResult = { 
          success: false, 
          error: `Erreur connexion Supabase: ${error instanceof Error ? error.message : 'Erreur inconnue'}. Vérifiez l'URL et les credentials.` 
        };
      }
      
    } else if (config.type === 'mysql') {
      // Test MySQL
      try {
        const mysql = await import('mysql2/promise');
        const connection = await mysql.createConnection({
          host: config.host || 'localhost',
          port: config.port || 3307,
          database: config.database || 'stock_management',
          user: config.username || 'root',
          password: config.password || ''
        });
        
        // Test simple
        const [rows] = await connection.execute('SELECT 1 as test');
        await connection.end();
        
        testResult = { success: true, message: 'Connexion MySQL OK' };
        
      } catch (error) {
        testResult = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur connexion MySQL' 
        };
      }
      
    } else if (config.type === 'postgresql') {
      // Test PostgreSQL
      try {
        const { Client } = await import('pg');
        const client = new Client({
          host: config.host || 'localhost',
          port: config.port || 5432,
          database: config.database || 'stock_management',
          user: config.username || 'postgres',
          password: config.password || 'postgres'
        });
        
        await client.connect();
        const result = await client.query('SELECT 1 as test');
        await client.end();
        
        testResult = { success: true, message: 'Connexion PostgreSQL OK' };
        
      } catch (error) {
        testResult = { 
          success: false, 
          error: error instanceof Error ? error.message : 'Erreur connexion PostgreSQL' 
        };
      }
    }

    console.log('🧪 Test result:', testResult);
    
    return c.json({
      success: testResult?.success || false,
      message: testResult?.message,
      error: testResult?.error,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Erreur test database backend:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur test database'
    }, 500);
  }
});

export default database;