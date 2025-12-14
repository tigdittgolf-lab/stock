// Vérifier la structure de la table article
import { supabaseAdmin } from './src/supabaseClient.js';

async function checkArticleTableStructure() {
  console.log('🔍 Checking article table structure...');
  
  const testTenant = '2025_bu01';
  
  try {
    // Obtenir la structure de la table
    const { data: tableInfo, error: infoError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns 
        WHERE table_schema = '${testTenant}' 
        AND table_name = 'article'
        ORDER BY ordinal_position;
      `
    });
    
    if (infoError) {
      console.error('❌ Error getting table info:', infoError);
      return;
    }
    
    console.log('📋 Article table structure:');
    console.table(tableInfo);
    
    // Obtenir un échantillon de données
    const { data: sampleData, error: sampleError } = await supabaseAdmin.rpc('exec_sql', {
      sql: `SELECT narticle, stock_f, stock_bl FROM "${testTenant}".article LIMIT 3;`
    });
    
    if (sampleError) {
      console.error('❌ Error getting sample data:', sampleError);
    } else {
      console.log('\n📊 Sample data:');
      console.table(sampleData);
    }
    
    // Créer une fonction simple qui fonctionne
    console.log('\n🔧 Creating simple working function...');
    
    const simpleFunction = `
      CREATE OR REPLACE FUNCTION get_article_stock_simple(
        p_tenant TEXT,
        p_narticle TEXT
      )
      RETURNS JSON
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        result JSON;
        sql_query TEXT;
      BEGIN
        sql_query := format('
          SELECT json_build_object(
            ''narticle'', narticle,
            ''stock_f'', stock_f,
            ''stock_bl'', stock_bl
          ) FROM "%s".article 
          WHERE narticle = %L
          LIMIT 1',
          p_tenant, p_narticle
        );
        
        EXECUTE sql_query INTO result;
        
        RETURN result;
      END;
      $$;
    `;
    
    const { error: funcError } = await supabaseAdmin.rpc('exec_sql', {
      sql: simpleFunction.trim()
    });
    
    if (funcError) {
      console.error('❌ Error creating simple function:', funcError);
    } else {
      console.log('✅ Simple function created');
      
      // Tester la fonction simple
      const { data: testResult, error: testError } = await supabaseAdmin.rpc('get_article_stock_simple', {
        p_tenant: testTenant,
        p_narticle: '1000'
      });
      
      if (testError) {
        console.error('❌ Simple function test failed:', testError);
      } else {
        console.log('✅ Simple function works:', testResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Failed to check table structure:', error);
  }
}

checkArticleTableStructure();