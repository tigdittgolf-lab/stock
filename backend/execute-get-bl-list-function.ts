// Exécuter la fonction get_bl_list_simple
import { supabaseAdmin } from './src/supabaseClient.js';
import { readFileSync } from 'fs';

async function executeGetBlListFunction() {
  console.log('🔧 Creating get_bl_list_simple function...');
  
  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync('./create-get-bl-list-simple.sql', 'utf8');
    
    // Exécuter le SQL
    const { data, error } = await supabaseAdmin.rpc('exec_sql', {
      sql_query: sqlContent
    });
    
    if (error) {
      console.error('❌ Failed to create function:', error);
      return;
    }
    
    console.log('✅ Function get_bl_list_simple created successfully!');
    
    // Tester la fonction avec un tenant
    console.log('🧪 Testing function with tenant 2025_bu01...');
    
    const { data: testData, error: testError } = await supabaseAdmin.rpc('get_bl_list_simple', {
      p_tenant: '2025_bu01'
    });
    
    if (testError) {
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Test successful!');
      console.log(`📋 Found ${testData?.length || 0} delivery notes`);
      if (testData && testData.length > 0) {
        console.log('📄 Sample BL:', testData[0]);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

executeGetBlListFunction();