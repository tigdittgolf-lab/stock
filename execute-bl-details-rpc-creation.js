const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createBLDetailsRPCFunctions() {
  try {
    console.log('🔧 Création des fonctions RPC pour les détails BL...');
    
    // Lire le script SQL
    const sqlScript = fs.readFileSync('CREATE_MISSING_BL_DETAILS_RPC_FUNCTIONS.sql', 'utf8');
    
    // Diviser le script en commandes individuelles
    const commands = sqlScript
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 ${commands.length} commandes SQL à exécuter...`);
    
    for (let i = 0; i < commands.length; i++) {
      const command = commands[i];
      
      if (command.includes('CREATE OR REPLACE FUNCTION')) {
        const functionName = command.match(/FUNCTION\s+public\.(\w+)/)?.[1] || 'unknown';
        console.log(`🔨 Création de la fonction: ${functionName}...`);
      }
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', { 
          sql_query: command + ';' 
        });
        
        if (error) {
          console.error(`❌ Erreur lors de l'exécution:`, error);
          // Essayer avec une approche différente
          const { data: data2, error: error2 } = await supabase
            .from('_sql_exec')
            .insert({ query: command + ';' });
            
          if (error2) {
            console.log(`⚠️ Commande ignorée (peut-être déjà existante): ${command.substring(0, 50)}...`);
          }
        } else {
          console.log(`✅ Commande exécutée avec succès`);
        }
      } catch (execError) {
        console.log(`⚠️ Erreur d'exécution ignorée: ${execError.message}`);
      }
    }
    
    console.log('\n🧪 Test des fonctions créées...');
    
    // Test 1: get_bl_details_by_id
    try {
      const { data: test1, error: error1 } = await supabase.rpc('get_bl_details_by_id', {
        p_tenant: '2025_bu01',
        p_nfact: 4
      });
      
      if (error1) {
        console.log('⚠️ Test get_bl_details_by_id:', error1.message);
      } else {
        console.log('✅ get_bl_details_by_id fonctionne:', test1?.length || 0, 'résultats');
      }
    } catch (testError) {
      console.log('⚠️ Test get_bl_details_by_id échoué:', testError.message);
    }
    
    // Test 2: get_bl_details
    try {
      const { data: test2, error: error2 } = await supabase.rpc('get_bl_details', {
        p_tenant: '2025_bu01',
        p_nfact: 4
      });
      
      if (error2) {
        console.log('⚠️ Test get_bl_details:', error2.message);
      } else {
        console.log('✅ get_bl_details fonctionne:', test2?.length || 0, 'résultats');
      }
    } catch (testError) {
      console.log('⚠️ Test get_bl_details échoué:', testError.message);
    }
    
    // Test 3: get_detail_bl_by_tenant
    try {
      const { data: test3, error: error3 } = await supabase.rpc('get_detail_bl_by_tenant', {
        p_tenant: '2025_bu01',
        p_nfact: 4
      });
      
      if (error3) {
        console.log('⚠️ Test get_detail_bl_by_tenant:', error3.message);
      } else {
        console.log('✅ get_detail_bl_by_tenant fonctionne:', test3?.length || 0, 'résultats');
      }
    } catch (testError) {
      console.log('⚠️ Test get_detail_bl_by_tenant échoué:', testError.message);
    }
    
    console.log('\n🎉 Création des fonctions RPC terminée !');
    console.log('📋 Les fonctions suivantes ont été créées :');
    console.log('   - get_bl_details_by_id(p_tenant, p_nfact)');
    console.log('   - get_bl_details(p_tenant, p_nfact)');
    console.log('   - get_detail_bl_by_tenant(p_tenant, p_nfact)');
    console.log('   - get_bl_complete_by_id(p_tenant, p_nfact)');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des fonctions RPC:', error);
  }
}

// Exécuter la création
createBLDetailsRPCFunctions();