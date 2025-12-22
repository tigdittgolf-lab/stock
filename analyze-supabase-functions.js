// Analyser toutes les fonctions RPC disponibles dans Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeSupabaseFunctions() {
  console.log('🔍 ANALYSE DES FONCTIONS RPC SUPABASE');
  console.log('====================================\n');
  
  // Liste de toutes les fonctions RPC possibles basées sur l'application
  const possibleFunctions = [
    // Fonctions de base
    'get_articles_by_tenant',
    'get_clients_by_tenant',
    'get_fournisseurs_by_tenant',
    'get_families_by_tenant',
    'get_proformas_by_tenant',
    'get_activites_by_tenant',
    'get_bls_by_tenant',
    'get_factures_by_tenant',
    
    // Fonctions de détail
    'get_detail_bl_by_tenant',
    'get_detail_fact_by_tenant',
    'get_detail_proforma_by_tenant',
    
    // Fonctions CRUD
    'create_article',
    'update_article',
    'delete_article',
    'create_client',
    'update_client',
    'delete_client',
    'create_bl',
    'update_bl',
    'delete_bl',
    'create_facture',
    'update_facture',
    'delete_facture',
    
    // Fonctions métier
    'calculate_margin',
    'update_stock',
    'get_next_number',
    'get_sales_report',
    'get_stock_report',
    'validate_document',
    
    // Fonctions système
    'exec_sql',
    'execute_sql',
    'run_sql',
    'get_tenant_info',
    'create_tenant',
    'migrate_data',
    
    // Fonctions d'authentification
    'authenticate_user',
    'create_user',
    'update_user_permissions',
    'get_user_tenants'
  ];
  
  const workingFunctions = [];
  const failedFunctions = [];
  
  console.log('=== TEST DES FONCTIONS RPC ===\n');
  
  for (const funcName of possibleFunctions) {
    try {
      console.log(`Testing: ${funcName}...`);
      
      // Tester avec des paramètres génériques
      const testParams = {
        p_tenant: '2025_bu01',
        tenant: '2025_bu01',
        schema_name: '2025_bu01',
        id: 1,
        narticle: 'TEST',
        nclient: 'TEST',
        nfact: 1
      };
      
      const { data, error } = await supabase.rpc(funcName, testParams);
      
      if (error) {
        if (error.message.includes('Could not find')) {
          console.log(`❌ ${funcName}: Fonction non trouvée`);
          failedFunctions.push({ name: funcName, error: 'Not found' });
        } else {
          console.log(`⚠️ ${funcName}: ${error.message}`);
          // Même si erreur, la fonction existe
          workingFunctions.push({ 
            name: funcName, 
            status: 'exists_with_error',
            error: error.message,
            data: null
          });
        }
      } else {
        console.log(`✅ ${funcName}: Fonctionne (${data ? (Array.isArray(data) ? data.length : 1) : 0} résultats)`);
        workingFunctions.push({ 
          name: funcName, 
          status: 'working',
          data: data,
          dataType: Array.isArray(data) ? 'array' : typeof data
        });
      }
      
    } catch (err) {
      console.log(`💥 ${funcName}: Exception - ${err.message}`);
      failedFunctions.push({ name: funcName, error: err.message });
    }
  }
  
  console.log('\n=== RÉSUMÉ ===');
  console.log(`✅ Fonctions qui fonctionnent: ${workingFunctions.length}`);
  console.log(`❌ Fonctions non trouvées: ${failedFunctions.length}`);
  
  console.log('\n=== FONCTIONS DISPONIBLES ===');
  workingFunctions.forEach(func => {
    console.log(`- ${func.name} (${func.status})`);
    if (func.data && func.status === 'working') {
      if (Array.isArray(func.data) && func.data.length > 0) {
        console.log(`  Structure: ${Object.keys(func.data[0]).join(', ')}`);
      }
    }
  });
  
  console.log('\n=== FONCTIONS À CRÉER ===');
  failedFunctions.forEach(func => {
    if (func.error === 'Not found') {
      console.log(`- ${func.name}`);
    }
  });
  
  return { workingFunctions, failedFunctions };
}

analyzeSupabaseFunctions();