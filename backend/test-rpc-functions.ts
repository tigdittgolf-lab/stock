import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseClient.js';

async function testRPCFunctions() {
  console.log('🔍 Testing RPC Functions...\n');

  // Test 1: Vérifier si la fonction insert_article_to_tenant existe
  console.log('1. Testing insert_article_to_tenant function...');
  try {
    const { data, error } = await supabaseAdmin.rpc('insert_article_to_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: 'TEST001',
      p_famille: 'Test',
      p_designation: 'Article de test',
      p_nfournisseur: null,
      p_prix_unitaire: 100.00,
      p_marge: 20.00,
      p_tva: 19.00,
      p_prix_vente: 142.80,
      p_seuil: 10,
      p_stock_f: 50,
      p_stock_bl: 60
    });
    
    if (error) {
      console.log('❌ Function insert_article_to_tenant NOT FOUND or ERROR:', error.message);
      console.log('   → You need to execute the SQL script in Supabase first!\n');
    } else {
      console.log('✅ Function insert_article_to_tenant EXISTS and works:', data);
      console.log('   → Article should be in database now\n');
    }
  } catch (err) {
    console.log('❌ Function insert_article_to_tenant ERROR:', err);
  }

  // Test 2: Vérifier si on peut lire les articles
  console.log('2. Testing get_articles_by_tenant function...');
  try {
    const { data, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: '2025_bu01'
    });
    
    if (error) {
      console.log('❌ Function get_articles_by_tenant ERROR:', error.message);
    } else {
      console.log(`✅ Function get_articles_by_tenant works: ${data?.length || 0} articles found`);
      if (data && data.length > 0) {
        console.log('   → Sample article:', data[0]);
      }
    }
  } catch (err) {
    console.log('❌ Function get_articles_by_tenant ERROR:', err);
  }

  console.log('\n📋 SUMMARY:');
  console.log('If you see "NOT FOUND" errors above, you need to:');
  console.log('1. Copy the content of backend/create-all-missing-rpc-functions.sql');
  console.log('2. Go to your Supabase dashboard → SQL Editor');
  console.log('3. Paste and execute the script');
  console.log('4. Then restart your backend server');
}

testRPCFunctions();