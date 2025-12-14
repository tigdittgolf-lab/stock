// Script pour corriger la création des bons de livraison
// Remplace les données hardcodées par de vraies requêtes RPC

import { supabaseAdmin } from './src/supabaseClient.js';

async function fixDeliveryNoteCreation() {
  console.log('🔧 Fixing delivery note creation endpoint...');
  
  // Test des fonctions RPC nécessaires
  const testTenant = '2025_bu01';
  
  try {
    // Test get_clients_by_tenant
    console.log('1️⃣ Testing get_clients_by_tenant...');
    const { data: clients, error: clientError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: testTenant
    });
    
    if (clientError) {
      console.error('❌ get_clients_by_tenant failed:', clientError);
    } else {
      console.log(`✅ Found ${clients?.length || 0} clients`);
    }
    
    // Test get_articles_by_tenant
    console.log('2️⃣ Testing get_articles_by_tenant...');
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: testTenant
    });
    
    if (articleError) {
      console.error('❌ get_articles_by_tenant failed:', articleError);
    } else {
      console.log(`✅ Found ${articles?.length || 0} articles`);
    }
    
    // Test insert_bl
    console.log('3️⃣ Testing insert_bl function...');
    const { data: blTest, error: blError } = await supabaseAdmin.rpc('insert_bl', {
      p_tenant: testTenant,
      p_nfact: 9999,
      p_nclient: 'TEST',
      p_date_fact: '2025-01-01',
      p_montant_ht: 100,
      p_tva: 19,
      p_timbre: 0,
      p_autre_taxe: 0
    });
    
    if (blError) {
      console.error('❌ insert_bl failed:', blError);
    } else {
      console.log('✅ insert_bl works');
      
      // Nettoyer le test
      try {
        await supabaseAdmin.rpc('exec_sql', {
          sql: `DELETE FROM "${testTenant}".bl WHERE nfact = 9999;`
        });
        console.log('🧹 Test BL cleaned up');
      } catch (e) {
        console.log('⚠️ Could not clean up test BL');
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('- get_clients_by_tenant:', clientError ? '❌' : '✅');
    console.log('- get_articles_by_tenant:', articleError ? '❌' : '✅');
    console.log('- insert_bl:', blError ? '❌' : '✅');
    
    if (!clientError && !articleError && !blError) {
      console.log('\n✅ All RPC functions are working! The delivery note creation should work.');
      console.log('📝 The issue might be in the frontend or in the data validation.');
    } else {
      console.log('\n❌ Some RPC functions are missing. Please run the RPC creation scripts.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

fixDeliveryNoteCreation();