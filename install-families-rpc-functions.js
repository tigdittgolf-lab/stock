// Script pour installer les fonctions RPC des familles dans Supabase
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function installFamiliesRPCFunctions() {
  try {
    console.log('🚀 Installation des fonctions RPC pour les familles...');
    
    // Lire le fichier SQL
    const sqlContent = fs.readFileSync('CREATE_FAMILIES_RPC_FUNCTIONS.sql', 'utf8');
    
    // Diviser en fonctions individuelles
    const functions = sqlContent.split('-- ').filter(f => f.trim().length > 0);
    
    for (let i = 0; i < functions.length; i++) {
      const func = functions[i];
      if (func.includes('CREATE OR REPLACE FUNCTION')) {
        const functionName = func.match(/CREATE OR REPLACE FUNCTION (\w+)/)?.[1];
        console.log(`📝 Installation de la fonction: ${functionName}`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', {
            sql: '-- ' + func
          });
          
          if (error) {
            console.error(`❌ Erreur pour ${functionName}:`, error);
          } else {
            console.log(`✅ ${functionName} installée avec succès`);
          }
        } catch (err) {
          console.error(`❌ Exception pour ${functionName}:`, err.message);
        }
      }
    }
    
    // Test des fonctions installées
    console.log('\n🧪 Test des fonctions installées...');
    
    // Test get_families
    try {
      const { data, error } = await supabase.rpc('get_families', {
        p_tenant: '2025_bu01'
      });
      
      if (error) {
        console.log('❌ get_families error:', error);
      } else {
        console.log('✅ get_families fonctionne:', typeof data, data?.length || 'no length');
      }
    } catch (err) {
      console.log('❌ get_families exception:', err.message);
    }
    
    console.log('\n✅ Installation terminée !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

// Exécuter l'installation
installFamiliesRPCFunctions();