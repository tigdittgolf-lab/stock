// Tester directement les requêtes sur les tables
import { supabaseAdmin } from './src/supabaseClient.js';

async function testDirectQueries() {
  console.log('🔍 Testing direct queries on document tables...');
  
  const testTenant = '2025_bu01';
  
  try {
    // Test direct sur chaque table
    const queries = [
      { name: 'facture', sql: `SELECT COUNT(*) as count FROM "${testTenant}".facture;` },
      { name: 'proforma', sql: `SELECT COUNT(*) as count FROM "${testTenant}".proforma;` },
      { name: 'bon_commande', sql: `SELECT COUNT(*) as count FROM "${testTenant}".bon_commande;` },
      { name: 'facture_achat', sql: `SELECT COUNT(*) as count FROM "${testTenant}".facture_achat;` }
    ];
    
    console.log('📊 Direct table queries:');
    console.log('=======================');
    
    for (const query of queries) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: query.sql
        });
        
        if (error) {
          console.log(`❌ ${query.name}: ${error.message}`);
        } else {
          console.log(`✅ ${query.name}: ${data?.[0]?.count || 0} records`);
        }
      } catch (e) {
        console.log(`❌ ${query.name}: Exception - ${e.message}`);
      }
    }
    
    // Maintenant testons les fonctions RPC avec exec_sql directement
    console.log('\n🔧 Testing RPC functions with exec_sql:');
    console.log('=====================================');
    
    const rpcTests = [
      { name: 'Invoice Number', sql: `SELECT get_next_invoice_number('${testTenant}') as next_number;` },
      { name: 'Proforma Number', sql: `SELECT get_next_proforma_number('${testTenant}') as next_number;` },
      { name: 'Purchase Order Number', sql: `SELECT get_next_purchase_order_number('${testTenant}') as next_number;` },
      { name: 'Purchase Invoice Number', sql: `SELECT get_next_purchase_invoice_number('${testTenant}') as next_number;` }
    ];
    
    for (const test of rpcTests) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: test.sql
        });
        
        if (error) {
          console.log(`❌ ${test.name}: ${error.message}`);
        } else {
          console.log(`✅ ${test.name}: ${data?.[0]?.next_number || 'N/A'}`);
        }
      } catch (e) {
        console.log(`❌ ${test.name}: Exception - ${e.message}`);
      }
    }
    
    // Test de création d'une facture simple
    console.log('\n🧪 Testing simple invoice creation:');
    console.log('==================================');
    
    try {
      const { data: invoiceResult, error: invoiceError } = await supabaseAdmin.rpc('exec_sql', {
        sql: `SELECT insert_invoice('${testTenant}', 999, 'CL01', '2025-01-01', 100, 19) as result;`
      });
      
      if (invoiceError) {
        console.log(`❌ Invoice creation: ${invoiceError.message}`);
      } else {
        console.log(`✅ Invoice creation: ${invoiceResult?.[0]?.result || 'Success'}`);
        
        // Nettoyer
        await supabaseAdmin.rpc('exec_sql', {
          sql: `DELETE FROM "${testTenant}".facture WHERE nfact = 999;`
        });
        console.log('🧹 Test invoice cleaned up');
      }
    } catch (e) {
      console.log(`❌ Invoice creation: Exception - ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDirectQueries();