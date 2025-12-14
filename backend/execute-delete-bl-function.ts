// Exécuter la fonction de suppression de BL
import { supabaseAdmin } from './src/supabaseClient.js';
import { readFileSync } from 'fs';

async function executeDeleteBLFunction() {
  console.log('🔧 Creating delete_bl_with_stock_recovery function...');
  
  try {
    // Lire le fichier SQL
    const sqlContent = readFileSync('./create-delete-bl-function.sql', 'utf8');
    
    // Exécuter le SQL via une requête directe (puisque exec_sql ne fonctionne pas)
    console.log('📝 Function SQL content:');
    console.log('---');
    console.log(sqlContent);
    console.log('---');
    
    console.log('⚠️  Please execute this SQL in your Supabase SQL Editor');
    console.log('🔧 After execution, the delete endpoint will be available');
    
    // Tester si une fonction similaire existe déjà
    console.log('🧪 Testing if we can call existing functions...');
    
    const { data: testData, error: testError } = await supabaseAdmin.rpc('get_next_bl_number_simple', {
      p_tenant: '2025_bu01'
    });
    
    if (testError) {
      console.log('❌ RPC test failed:', testError);
    } else {
      console.log('✅ RPC system works, next BL number:', testData);
      console.log('📋 This means the delete function should work once created');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

executeDeleteBLFunction();