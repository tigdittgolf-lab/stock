import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

/**
 * API pour la migration des fonctions RPC vers MySQL
 * Crée les procédures stockées MySQL équivalentes aux fonctions RPC Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const { config, action, tenant } = await request.json();
    
    console.log(`🔧 MySQL RPC Migration API - Action: ${action}`);
    
    // Créer la connexion MySQL
    const connection = await mysql.createConnection({
      host: config.host || 'localhost',
      port: config.port || 3306,
      user: config.username || 'root',
      password: config.password || '',
      database: 'mysql', // Utiliser la base système pour créer les procédures
      multipleStatements: true
    });

    if (action === 'migrate') {
      return await migrateRPCToMySQL(connection);
    } else if (action === 'test') {
      return await testRPCFunctions(connection, tenant);
    } else {
      return NextResponse.json({
        success: false,
        error: `Action non supportée: ${action}`
      });
    }

  } catch (error) {
    console.error('❌ Erreur API MySQL RPC Migration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur MySQL RPC'
    });
  }
}

/**
 * Migre toutes les procédures stockées vers MySQL
 */
async function migrateRPCToMySQL(connection: mysql.Connection): Promise<NextResponse> {
  console.log('🔧 Migration des procédures stockées vers MySQL...');
  
  const mysqlProcedures = [
    // Procédure get_articles_by_tenant
    `DROP PROCEDURE IF EXISTS get_articles_by_tenant;`,
    `CREATE PROCEDURE get_articles_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT * FROM \`', p_tenant, '\`.article ORDER BY narticle');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Procédure get_suppliers_by_tenant
    `DROP PROCEDURE IF EXISTS get_suppliers_by_tenant;`,
    `CREATE PROCEDURE get_suppliers_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT * FROM \`', p_tenant, '\`.fournisseur ORDER BY nfournisseur');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Alias get_fournisseurs_by_tenant
    `DROP PROCEDURE IF EXISTS get_fournisseurs_by_tenant;`,
    `CREATE PROCEDURE get_fournisseurs_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       CALL get_suppliers_by_tenant(p_tenant);
     END;`,
    
    // Procédure get_clients_by_tenant
    `DROP PROCEDURE IF EXISTS get_clients_by_tenant;`,
    `CREATE PROCEDURE get_clients_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT * FROM \`', p_tenant, '\`.client ORDER BY nclient');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Procédure get_bl_list_by_tenant
    `DROP PROCEDURE IF EXISTS get_bl_list_by_tenant;`,
    `CREATE PROCEDURE get_bl_list_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT * FROM \`', p_tenant, '\`.bl ORDER BY nfact DESC');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Alias get_bl_list
    `DROP PROCEDURE IF EXISTS get_bl_list;`,
    `CREATE PROCEDURE get_bl_list(IN p_tenant VARCHAR(255))
     BEGIN
       CALL get_bl_list_by_tenant(p_tenant);
     END;`,
    
    // Procédure get_fact_list_by_tenant
    `DROP PROCEDURE IF EXISTS get_fact_list_by_tenant;`,
    `CREATE PROCEDURE get_fact_list_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT * FROM \`', p_tenant, '\`.fact ORDER BY nfact DESC');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Alias get_fact_list
    `DROP PROCEDURE IF EXISTS get_fact_list;`,
    `CREATE PROCEDURE get_fact_list(IN p_tenant VARCHAR(255))
     BEGIN
       CALL get_fact_list_by_tenant(p_tenant);
     END;`,
    
    // Procédure get_proforma_list_by_tenant
    `DROP PROCEDURE IF EXISTS get_proforma_list_by_tenant;`,
    `CREATE PROCEDURE get_proforma_list_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT * FROM \`', p_tenant, '\`.proforma ORDER BY nfact DESC');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Procédure get_next_bl_number_by_tenant
    `DROP PROCEDURE IF EXISTS get_next_bl_number_by_tenant;`,
    `CREATE PROCEDURE get_next_bl_number_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM \`', p_tenant, '\`.bl');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Alias get_next_bl_number
    `DROP PROCEDURE IF EXISTS get_next_bl_number;`,
    `CREATE PROCEDURE get_next_bl_number(IN p_tenant VARCHAR(255))
     BEGIN
       CALL get_next_bl_number_by_tenant(p_tenant);
     END;`,
    
    // Alias get_next_bl_number_simple
    `DROP PROCEDURE IF EXISTS get_next_bl_number_simple;`,
    `CREATE PROCEDURE get_next_bl_number_simple(IN p_tenant VARCHAR(255))
     BEGIN
       CALL get_next_bl_number_by_tenant(p_tenant);
     END;`,
    
    // Procédure get_next_fact_number_by_tenant
    `DROP PROCEDURE IF EXISTS get_next_fact_number_by_tenant;`,
    `CREATE PROCEDURE get_next_fact_number_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM \`', p_tenant, '\`.fact');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`,
    
    // Alias get_next_fact_number
    `DROP PROCEDURE IF EXISTS get_next_fact_number;`,
    `CREATE PROCEDURE get_next_fact_number(IN p_tenant VARCHAR(255))
     BEGIN
       CALL get_next_fact_number_by_tenant(p_tenant);
     END;`,
    
    // Procédure get_next_proforma_number_by_tenant
    `DROP PROCEDURE IF EXISTS get_next_proforma_number_by_tenant;`,
    `CREATE PROCEDURE get_next_proforma_number_by_tenant(IN p_tenant VARCHAR(255))
     BEGIN
       DECLARE sql_stmt TEXT;
       SET sql_stmt = CONCAT('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM \`', p_tenant, '\`.proforma');
       SET @sql = sql_stmt;
       PREPARE stmt FROM @sql;
       EXECUTE stmt;
       DEALLOCATE PREPARE stmt;
     END;`
  ];
  
  try {
    let functionsCreated = 0;
    
    for (const [index, proc] of mysqlProcedures.entries()) {
      console.log(`  📝 Création procédure MySQL ${index + 1}/${mysqlProcedures.length}...`);
      await connection.execute(proc);
      
      // Compter seulement les CREATE (pas les DROP)
      if (proc.includes('CREATE PROCEDURE')) {
        functionsCreated++;
      }
    }
    
    await connection.end();
    
    console.log(`✅ ${functionsCreated} procédures stockées migrées vers MySQL`);
    return NextResponse.json({
      success: true,
      message: `${functionsCreated} procédures MySQL créées avec succès`,
      functionsCreated
    });
    
  } catch (error) {
    await connection.end();
    console.error('❌ Erreur migration procédures MySQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur migration MySQL'
    });
  }
}

/**
 * Teste les procédures stockées après migration
 */
async function testRPCFunctions(connection: mysql.Connection, tenant: string): Promise<NextResponse> {
  console.log(`🧪 Test des procédures stockées MySQL pour tenant: ${tenant}...`);
  
  const testProcedures = [
    'get_articles_by_tenant',
    'get_suppliers_by_tenant', 
    'get_clients_by_tenant',
    'get_bl_list_by_tenant',
    'get_fact_list_by_tenant'
  ];
  
  try {
    let testsRun = 0;
    let testsSuccessful = 0;
    const results: any[] = [];
    
    for (const procName of testProcedures) {
      try {
        console.log(`  🔍 Test ${procName}...`);
        
        // MySQL utilise CALL pour les procédures stockées
        const [rows] = await connection.execute(`CALL ${procName}(?)`, [tenant]);
        testsRun++;
        testsSuccessful++;
        
        const resultCount = Array.isArray(rows) ? rows.length : 0;
        console.log(`    ✅ ${procName}: ${resultCount} résultats`);
        
        results.push({
          procedure: procName,
          success: true,
          resultCount
        });
        
      } catch (error) {
        testsRun++;
        console.error(`    ❌ ${procName}: ${error}`);
        
        results.push({
          procedure: procName,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur test'
        });
      }
    }
    
    await connection.end();
    
    console.log(`📊 Tests MySQL: ${testsSuccessful}/${testsRun} réussis`);
    
    return NextResponse.json({
      success: testsSuccessful > 0,
      message: `${testsSuccessful}/${testsRun} tests MySQL réussis`,
      testsRun,
      testsSuccessful,
      results
    });
    
  } catch (error) {
    await connection.end();
    console.error('❌ Erreur test procédures MySQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur test MySQL'
    });
  }
}