// Service de migration des fonctions RPC
export class RPCMigrationService {
  
  /**
   * Migre toutes les fonctions RPC de Supabase vers PostgreSQL
   */
  static async migrateRPCToPostgreSQL(pgClient: any): Promise<boolean> {
    console.log('🔧 Migration des fonctions RPC vers PostgreSQL...');
    
    const rpcFunctions = [
      // Fonction get_articles_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
      RETURNS TABLE(
        narticle VARCHAR,
        famille VARCHAR,
        designation VARCHAR,
        nfournisseur VARCHAR,
        prix_unitaire DECIMAL,
        marge DECIMAL,
        tva DECIMAL,
        prix_vente DECIMAL,
        seuil INTEGER,
        stock_f INTEGER,
        stock_bl INTEGER
      )
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE format('SELECT * FROM "%s".article ORDER BY narticle', p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Fonction get_suppliers_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_suppliers_by_tenant(p_tenant TEXT)
      RETURNS TABLE(
        nfournisseur VARCHAR,
        nom_fournisseur VARCHAR,
        resp_fournisseur VARCHAR,
        adresse_fourni VARCHAR,
        tel VARCHAR,
        tel1 VARCHAR,
        tel2 VARCHAR,
        caf DECIMAL,
        cabl DECIMAL,
        email VARCHAR,
        commentaire TEXT
      )
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE format('SELECT * FROM "%s".fournisseur ORDER BY nfournisseur', p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Alias get_fournisseurs_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
      RETURNS TABLE(
        nfournisseur VARCHAR,
        nom_fournisseur VARCHAR,
        resp_fournisseur VARCHAR,
        adresse_fourni VARCHAR,
        tel VARCHAR,
        tel1 VARCHAR,
        tel2 VARCHAR,
        caf DECIMAL,
        cabl DECIMAL,
        email VARCHAR,
        commentaire TEXT
      )
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY SELECT * FROM get_suppliers_by_tenant(p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Fonction get_clients_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
      RETURNS TABLE(
        nclient VARCHAR,
        nom_client VARCHAR,
        resp_client VARCHAR,
        adresse_client VARCHAR,
        tel VARCHAR,
        tel1 VARCHAR,
        tel2 VARCHAR,
        caf DECIMAL,
        cabl DECIMAL,
        email VARCHAR,
        commentaire TEXT
      )
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE format('SELECT * FROM "%s".client ORDER BY nclient', p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Fonction get_bl_list_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
      RETURNS TABLE(
        nfact INTEGER,
        nclient VARCHAR,
        date_fact DATE,
        total_ht DECIMAL,
        total_ttc DECIMAL
      )
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE format('SELECT * FROM "%s".bl ORDER BY nfact DESC', p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Alias get_bl_list
      `
      CREATE OR REPLACE FUNCTION get_bl_list(p_tenant TEXT)
      RETURNS TABLE(
        nfact INTEGER,
        nclient VARCHAR,
        date_fact DATE,
        total_ht DECIMAL,
        total_ttc DECIMAL
      )
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY SELECT * FROM get_bl_list_by_tenant(p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Fonction get_fact_list_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_fact_list_by_tenant(p_tenant TEXT)
      RETURNS TABLE(
        nfact INTEGER,
        nclient VARCHAR,
        date_fact DATE,
        total_ht DECIMAL,
        total_ttc DECIMAL
      )
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE format('SELECT * FROM "%s".fact ORDER BY nfact DESC', p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Fonction get_next_bl_number_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_next_bl_number_by_tenant(p_tenant TEXT)
      RETURNS TABLE(next_number INTEGER)
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".bl', p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `,
      
      // Fonction get_next_fact_number_by_tenant
      `
      CREATE OR REPLACE FUNCTION get_next_fact_number_by_tenant(p_tenant TEXT)
      RETURNS TABLE(next_number INTEGER)
      SECURITY DEFINER
      AS $$
      BEGIN
        RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".fact', p_tenant);
      END;
      $$ LANGUAGE plpgsql;
      `
    ];
    
    try {
      for (const [index, func] of rpcFunctions.entries()) {
        console.log(`  📝 Création fonction RPC ${index + 1}/${rpcFunctions.length}...`);
        await pgClient.query(func);
      }
      
      console.log('✅ Toutes les fonctions RPC migrées vers PostgreSQL');
      return true;
    } catch (error) {
      console.error('❌ Erreur migration RPC PostgreSQL:', error);
      return false;
    }
  }
  
  /**
   * Migre toutes les procédures stockées vers MySQL
   */
  static async migrateRPCToMySQL(mysqlConnection: any): Promise<boolean> {
    console.log('🔧 Migration des procédures stockées vers MySQL...');
    
    const mysqlProcedures = [
      // Procédure get_articles_by_tenant
      `
      DROP PROCEDURE IF EXISTS get_articles_by_tenant;
      `,
      `
      CREATE PROCEDURE get_articles_by_tenant(IN p_tenant VARCHAR(255))
      BEGIN
        SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.article ORDER BY narticle');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
      `,
      
      // Procédure get_suppliers_by_tenant
      `
      DROP PROCEDURE IF EXISTS get_suppliers_by_tenant;
      `,
      `
      CREATE PROCEDURE get_suppliers_by_tenant(IN p_tenant VARCHAR(255))
      BEGIN
        SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.fournisseur ORDER BY nfournisseur');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
      `,
      
      // Procédure get_clients_by_tenant
      `
      DROP PROCEDURE IF EXISTS get_clients_by_tenant;
      `,
      `
      CREATE PROCEDURE get_clients_by_tenant(IN p_tenant VARCHAR(255))
      BEGIN
        SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.client ORDER BY nclient');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
      `,
      
      // Procédure get_bl_list_by_tenant
      `
      DROP PROCEDURE IF EXISTS get_bl_list_by_tenant;
      `,
      `
      CREATE PROCEDURE get_bl_list_by_tenant(IN p_tenant VARCHAR(255))
      BEGIN
        SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.bl ORDER BY nfact DESC');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
      `,
      
      // Procédure get_fact_list_by_tenant
      `
      DROP PROCEDURE IF EXISTS get_fact_list_by_tenant;
      `,
      `
      CREATE PROCEDURE get_fact_list_by_tenant(IN p_tenant VARCHAR(255))
      BEGIN
        SET @sql = CONCAT('SELECT * FROM \`', p_tenant, '\`.fact ORDER BY nfact DESC');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
      END
      `
    ];
    
    try {
      for (const [index, proc] of mysqlProcedures.entries()) {
        console.log(`  📝 Création procédure MySQL ${index + 1}/${mysqlProcedures.length}...`);
        await mysqlConnection.execute(proc);
      }
      
      console.log('✅ Toutes les procédures stockées migrées vers MySQL');
      return true;
    } catch (error) {
      console.error('❌ Erreur migration procédures MySQL:', error);
      return false;
    }
  }
  
  /**
   * Teste les fonctions RPC après migration
   */
  static async testRPCFunctions(client: any, dbType: 'postgresql' | 'mysql', tenant: string): Promise<boolean> {
    console.log(`🧪 Test des fonctions RPC ${dbType}...`);
    
    const testFunctions = [
      'get_articles_by_tenant',
      'get_suppliers_by_tenant', 
      'get_clients_by_tenant',
      'get_bl_list_by_tenant',
      'get_fact_list_by_tenant'
    ];
    
    try {
      for (const funcName of testFunctions) {
        console.log(`  🔍 Test ${funcName}...`);
        
        if (dbType === 'postgresql') {
          const result = await client.query(`SELECT * FROM ${funcName}($1)`, [tenant]);
          console.log(`    ✅ ${funcName}: ${result.rows.length} résultats`);
        } else {
          // MySQL utilise CALL pour les procédures stockées
          const [rows] = await client.execute(`CALL ${funcName}(?)`, [tenant]);
          console.log(`    ✅ ${funcName}: ${rows.length} résultats`);
        }
      }
      
      console.log(`✅ Tous les tests RPC ${dbType} réussis`);
      return true;
    } catch (error) {
      console.error(`❌ Erreur test RPC ${dbType}:`, error);
      return false;
    }
  }
}