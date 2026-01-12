// Installation des fonctions RPC corrigées
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg';

async function installCorrectedFunctions() {
  console.log('🔧 Installation des fonctions RPC corrigées...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    const sqlContent = fs.readFileSync('CREATE_BL_UPDATE_RPC_FUNCTIONS_CORRECTED.sql', 'utf8');
    
    // Diviser en fonctions individuelles
    const functions = sqlContent.split('CREATE OR REPLACE FUNCTION');
    
    console.log(`📋 ${functions.length - 1} fonctions corrigées trouvées`);
    
    // Installer chaque fonction
    for (let i = 1; i < functions.length; i++) {
      const functionSQL = 'CREATE OR REPLACE FUNCTION' + functions[i];
      const functionName = functionSQL.match(/FUNCTION\s+(\w+)/)?.[1] || `fonction_${i}`;
      
      console.log(`📤 Installation de ${functionName} (corrigée)...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: functionSQL
      });
      
      if (error) {
        console.error(`❌ Erreur ${functionName}:`, error);
      } else {
        console.log(`✅ ${functionName} corrigée installée`);
      }
    }
    
    console.log('\n🧪 Test des fonctions corrigées...');
    
    // Test update_bl corrigé
    const testUpdate = await supabase.rpc('update_bl', {
      p_tenant: '2025_bu01',
      p_nfact: 5,
      p_nclient: '415',
      p_date_fact: '2025-12-21',
      p_montant_ht: 3000,
      p_tva: 570,
      p_montant_ttc: 3570
    });
    
    console.log('📋 Test update_bl:', testUpdate.error ? testUpdate.error : testUpdate.data);
    
    // Test delete_bl_details corrigé
    const testDelete = await supabase.rpc('delete_bl_details', {
      p_tenant: '2025_bu01',
      p_nfact: 5
    });
    
    console.log('🗑️ Test delete_bl_details:', testDelete.error ? testDelete.error : testDelete.data);
    
    // Test insert_bl_detail corrigé
    const testInsert = await supabase.rpc('insert_bl_detail', {
      p_tenant: '2025_bu01',
      p_nfact: 5,
      p_narticle: '142',
      p_qte: 20,
      p_prix: 200,
      p_tva: 19,
      p_total_ligne: 4760
    });
    
    console.log('➕ Test insert_bl_detail:', testInsert.error ? testInsert.error : testInsert.data);
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

installCorrectedFunctions().catch(console.error);