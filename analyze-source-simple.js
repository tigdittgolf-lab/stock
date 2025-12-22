// Analyser la base source avec les RPC functions existantes
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function analyzeWithRPC() {
  console.log('🔍 Analyse avec les fonctions RPC existantes...\n');
  
  const schemas = ['2025_bu01', '2026_bu01'];
  
  for (const schema of schemas) {
    console.log(`=== ANALYSE SCHEMA ${schema} ===`);
    
    // Test des différentes fonctions RPC pour voir ce qui existe
    const rpcFunctions = [
      'get_articles_by_tenant',
      'get_clients_by_tenant', 
      'get_fournisseurs_by_tenant',
      'get_activites_by_tenant',
      'get_activite_by_tenant',
      'get_bl_by_tenant',
      'get_bls_by_tenant',
      'get_factures_by_tenant',
      'get_proformas_by_tenant',
      'get_detail_bl_by_tenant',
      'get_detail_fact_by_tenant',
      'get_families_by_tenant',
      'get_famille_art_by_tenant'
    ];
    
    for (const funcName of rpcFunctions) {
      try {
        console.log(`\n--- Test fonction: ${funcName} ---`);
        const { data, error } = await supabase.rpc(funcName, { p_tenant: schema });
        
        if (error) {
          console.log(`❌ ${funcName}: ${error.message}`);
        } else {
          console.log(`✅ ${funcName}: ${data ? data.length : 0} enregistrements`);
          if (data && data.length > 0) {
            console.log('Colonnes:', Object.keys(data[0]));
            console.log('Premier enregistrement:', JSON.stringify(data[0], null, 2));
          }
        }
      } catch (err) {
        console.log(`💥 ${funcName}: Erreur - ${err.message}`);
      }
    }
  }
}

analyzeWithRPC();