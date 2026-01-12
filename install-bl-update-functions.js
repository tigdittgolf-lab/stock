// Script pour installer les fonctions RPC de modification de BL dans Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NDgwNDMsImV4cCI6MjA4MTIyNDA0M30.5LS_VF6mkFIodLIe3oHEYdlrZD0-rXJioEm2HVFcsBg';

async function installBLUpdateFunctions() {
  console.log('🚀 Installation des fonctions RPC de modification de BL...');
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('CREATE_BL_UPDATE_RPC_FUNCTIONS.sql', 'utf8');
    
    // Diviser en fonctions individuelles
    const functions = sqlContent.split('CREATE OR REPLACE FUNCTION');
    
    console.log(`📋 ${functions.length - 1} fonctions trouvées`);
    
    // Installer chaque fonction
    for (let i = 1; i < functions.length; i++) {
      const functionSQL = 'CREATE OR REPLACE FUNCTION' + functions[i];
      const functionName = functionSQL.match(/FUNCTION\s+(\w+)/)?.[1] || `fonction_${i}`;
      
      console.log(`📤 Installation de ${functionName}...`);
      
      const { data, error } = await supabase.rpc('exec_sql', {
        sql: functionSQL
      });
      
      if (error) {
        console.error(`❌ Erreur ${functionName}:`, error);
      } else {
        console.log(`✅ ${functionName} installée`);
      }
    }
    
    console.log('\n🎯 Test des fonctions installées...');
    
    // Tester update_bl
    const testUpdate = await supabase.rpc('update_bl', {
      p_tenant: '2025_bu01',
      p_nfact: 5,
      p_nclient: '415',
      p_date_fact: '2025-12-21',
      p_montant_ht: 2000,
      p_tva: 380,
      p_montant_ttc: 2380
    });
    
    if (testUpdate.error) {
      console.error('❌ Test update_bl échoué:', testUpdate.error);
    } else {
      console.log('✅ Test update_bl réussi');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

installBLUpdateFunctions().catch(console.error);