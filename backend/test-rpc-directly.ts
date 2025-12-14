// Test direct des fonctions RPC
import { supabaseAdmin } from './src/supabaseClient.js';

async function testRPCDirectly() {
  console.log('🧪 TEST DIRECT DES FONCTIONS RPC');
  console.log('================================\n');
  
  try {
    // Test get_articles_by_tenant
    console.log('📋 Test get_articles_by_tenant...');
    
    const { data: articles, error: articlesError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: '2025_bu01'
    });
    
    if (articlesError) {
      console.error('❌ Erreur RPC articles:', articlesError);
    } else {
      console.log(`✅ RPC articles: ${articles?.length || 0} trouvés`);
      articles?.forEach((article: any, index: number) => {
        console.log(`   ${index + 1}. ${article.narticle}: ${article.designation}`);
      });
    }
    
    // Test direct avec exec_sql
    console.log('\n📋 Test exec_sql direct...');
    
    const { data: directData, error: directError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'SELECT COUNT(*) as count FROM "2025_bu01".article;'
    });
    
    if (directError) {
      console.error('❌ Erreur exec_sql:', directError);
    } else {
      console.log('✅ exec_sql résultat:', directData);
    }
    
    // Test avec une requête SELECT directe
    console.log('\n📋 Test SELECT direct...');
    
    const { data: selectData, error: selectError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'SELECT narticle, designation FROM "2025_bu01".article LIMIT 5;'
    });
    
    if (selectError) {
      console.error('❌ Erreur SELECT:', selectError);
    } else {
      console.log('✅ SELECT résultat:', selectData);
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testRPCDirectly();