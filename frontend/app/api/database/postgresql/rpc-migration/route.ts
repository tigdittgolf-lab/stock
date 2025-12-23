import { NextRequest, NextResponse } from 'next/server';
import { Client } from 'pg';

/**
 * API pour la migration des fonctions RPC vers PostgreSQL
 * Crée les fonctions PostgreSQL équivalentes aux fonctions RPC Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const { config, action, tenant } = await request.json();
    
    console.log(`🔧 PostgreSQL RPC Migration API - Action: ${action}`);
    
    // Créer le client PostgreSQL
    const client = new Client({
      host: config.host || 'localhost',
      port: config.port || 5432,
      user: config.username || 'postgres',
      password: config.password || 'postgres',
      database: config.database || 'postgres'
    });

    await client.connect();

    if (action === 'migrate') {
      return await migrateRPCToPostgreSQL(client);
    } else if (action === 'test') {
      return await testRPCFunctions(client, tenant);
    } else {
      await client.end();
      return NextResponse.json({
        success: false,
        error: `Action non supportée: ${action}`
      });
    }

  } catch (error) {
    console.error('❌ Erreur API PostgreSQL RPC Migration:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur PostgreSQL RPC'
    });
  }
}

/**
 * Migre toutes les fonctions RPC vers PostgreSQL
 */
async function migrateRPCToPostgreSQL(client: Client): Promise<NextResponse> {
  console.log('🔧 Migration des fonctions RPC vers PostgreSQL...');
  
  const rpcFunctions = [
    // Fonction get_articles_by_tenant
    `CREATE OR REPLACE FUNCTION get_articles_by_tenant(p_tenant TEXT)
     RETURNS TABLE(
       narticle TEXT,
       famille TEXT,
       designation TEXT,
       nfournisseur TEXT,
       prix_unitaire NUMERIC,
       marge NUMERIC,
       tva NUMERIC,
       prix_vente NUMERIC,
       seuil INTEGER,
       stock_f INTEGER,
       stock_bl INTEGER
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl FROM "%s".article ORDER BY narticle', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_suppliers_by_tenant
    `CREATE OR REPLACE FUNCTION get_suppliers_by_tenant(p_tenant TEXT)
     RETURNS TABLE(
       nfournisseur TEXT,
       nom_fournisseur TEXT,
       resp_fournisseur TEXT,
       adresse_fourni TEXT,
       tel TEXT,
       tel1 TEXT,
       tel2 TEXT,
       caf NUMERIC,
       cabl NUMERIC,
       email TEXT,
       commentaire TEXT
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, tel1, tel2, caf, cabl, email, commentaire FROM "%s".fournisseur ORDER BY nfournisseur', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Alias get_fournisseurs_by_tenant
    `CREATE OR REPLACE FUNCTION get_fournisseurs_by_tenant(p_tenant TEXT)
     RETURNS TABLE(
       nfournisseur TEXT,
       nom_fournisseur TEXT,
       resp_fournisseur TEXT,
       adresse_fourni TEXT,
       tel TEXT,
       tel1 TEXT,
       tel2 TEXT,
       caf NUMERIC,
       cabl NUMERIC,
       email TEXT,
       commentaire TEXT
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY SELECT * FROM get_suppliers_by_tenant(p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_clients_by_tenant
    `CREATE OR REPLACE FUNCTION get_clients_by_tenant(p_tenant TEXT)
     RETURNS TABLE(
       nclient TEXT,
       nom_client TEXT,
       resp_client TEXT,
       adresse_client TEXT,
       tel TEXT,
       tel1 TEXT,
       tel2 TEXT,
       caf NUMERIC,
       cabl NUMERIC,
       email TEXT,
       commentaire TEXT
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT nclient, nom_client, resp_client, adresse_client, tel, tel1, tel2, caf, cabl, email, commentaire FROM "%s".client ORDER BY nclient', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_bl_list_by_tenant
    `CREATE OR REPLACE FUNCTION get_bl_list_by_tenant(p_tenant TEXT)
     RETURNS TABLE(
       nfact INTEGER,
       nclient TEXT,
       date_fact DATE,
       total_ht NUMERIC,
       total_ttc NUMERIC
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT nfact, nclient, date_fact, total_ht, total_ttc FROM "%s".bl ORDER BY nfact DESC', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Alias get_bl_list
    `CREATE OR REPLACE FUNCTION get_bl_list(p_tenant TEXT)
     RETURNS TABLE(
       nfact INTEGER,
       nclient TEXT,
       date_fact DATE,
       total_ht NUMERIC,
       total_ttc NUMERIC
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY SELECT * FROM get_bl_list_by_tenant(p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_fact_list_by_tenant
    `CREATE OR REPLACE FUNCTION get_fact_list_by_tenant(p_tenant TEXT)
     RETURNS TABLE(
       nfact INTEGER,
       nclient TEXT,
       date_fact DATE,
       total_ht NUMERIC,
       total_ttc NUMERIC
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT nfact, nclient, date_fact, total_ht, total_ttc FROM "%s".fact ORDER BY nfact DESC', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Alias get_fact_list
    `CREATE OR REPLACE FUNCTION get_fact_list(p_tenant TEXT)
     RETURNS TABLE(
       nfact INTEGER,
       nclient TEXT,
       date_fact DATE,
       total_ht NUMERIC,
       total_ttc NUMERIC
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY SELECT * FROM get_fact_list_by_tenant(p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_proforma_list_by_tenant
    `CREATE OR REPLACE FUNCTION get_proforma_list_by_tenant(p_tenant TEXT)
     RETURNS TABLE(
       nfact INTEGER,
       nclient TEXT,
       date_fact DATE,
       total_ht NUMERIC,
       total_ttc NUMERIC
     )
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT nfact, nclient, date_fact, total_ht, total_ttc FROM "%s".proforma ORDER BY nfact DESC', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_next_bl_number_by_tenant
    `CREATE OR REPLACE FUNCTION get_next_bl_number_by_tenant(p_tenant TEXT)
     RETURNS TABLE(next_number INTEGER)
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".bl', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Alias get_next_bl_number
    `CREATE OR REPLACE FUNCTION get_next_bl_number(p_tenant TEXT)
     RETURNS TABLE(next_number INTEGER)
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY SELECT * FROM get_next_bl_number_by_tenant(p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Alias get_next_bl_number_simple
    `CREATE OR REPLACE FUNCTION get_next_bl_number_simple(p_tenant TEXT)
     RETURNS TABLE(next_number INTEGER)
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY SELECT * FROM get_next_bl_number_by_tenant(p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_next_fact_number_by_tenant
    `CREATE OR REPLACE FUNCTION get_next_fact_number_by_tenant(p_tenant TEXT)
     RETURNS TABLE(next_number INTEGER)
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".fact', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Alias get_next_fact_number
    `CREATE OR REPLACE FUNCTION get_next_fact_number(p_tenant TEXT)
     RETURNS TABLE(next_number INTEGER)
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY SELECT * FROM get_next_fact_number_by_tenant(p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`,
    
    // Fonction get_next_proforma_number_by_tenant
    `CREATE OR REPLACE FUNCTION get_next_proforma_number_by_tenant(p_tenant TEXT)
     RETURNS TABLE(next_number INTEGER)
     SECURITY DEFINER
     AS $function$
     BEGIN
       RETURN QUERY EXECUTE format('SELECT COALESCE(MAX(nfact), 0) + 1 as next_number FROM "%s".proforma', p_tenant);
     END;
     $function$ LANGUAGE plpgsql;`
  ];
  
  try {
    let functionsCreated = 0;
    
    for (const [index, func] of rpcFunctions.entries()) {
      console.log(`  📝 Création fonction RPC ${index + 1}/${rpcFunctions.length}...`);
      await client.query(func);
      functionsCreated++;
    }
    
    await client.end();
    
    console.log(`✅ ${functionsCreated} fonctions RPC migrées vers PostgreSQL`);
    return NextResponse.json({
      success: true,
      message: `${functionsCreated} fonctions PostgreSQL créées avec succès`,
      functionsCreated
    });
    
  } catch (error) {
    await client.end();
    console.error('❌ Erreur migration fonctions PostgreSQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur migration PostgreSQL'
    });
  }
}

/**
 * Teste les fonctions RPC après migration
 */
async function testRPCFunctions(client: Client, tenant: string): Promise<NextResponse> {
  console.log(`🧪 Test des fonctions RPC PostgreSQL pour tenant: ${tenant}...`);
  
  const testFunctions = [
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
    
    for (const funcName of testFunctions) {
      try {
        console.log(`  🔍 Test ${funcName}...`);
        
        const result = await client.query(`SELECT * FROM ${funcName}($1)`, [tenant]);
        testsRun++;
        testsSuccessful++;
        
        const resultCount = result.rows.length;
        console.log(`    ✅ ${funcName}: ${resultCount} résultats`);
        
        results.push({
          function: funcName,
          success: true,
          resultCount
        });
        
      } catch (error) {
        testsRun++;
        console.error(`    ❌ ${funcName}: ${error}`);
        
        results.push({
          function: funcName,
          success: false,
          error: error instanceof Error ? error.message : 'Erreur test'
        });
      }
    }
    
    await client.end();
    
    console.log(`📊 Tests PostgreSQL: ${testsSuccessful}/${testsRun} réussis`);
    
    return NextResponse.json({
      success: testsSuccessful > 0,
      message: `${testsSuccessful}/${testsRun} tests PostgreSQL réussis`,
      testsRun,
      testsSuccessful,
      results
    });
    
  } catch (error) {
    await client.end();
    console.error('❌ Erreur test fonctions PostgreSQL:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur test PostgreSQL'
    });
  }
}