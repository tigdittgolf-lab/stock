// Tester les fonctions manquantes après les avoir créées
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMissingFunctions() {
  console.log('🧪 Test des fonctions manquantes...\n');
  
  const schema = '2025_bu01';
  
  // Test des nouvelles fonctions
  const newFunctions = [
    'get_fournisseurs_by_tenant',
    'get_activites_by_tenant', 
    'get_bls_by_tenant',
    'get_factures_by_tenant',
    'get_detail_bl_by_tenant',
    'get_detail_fact_by_tenant',
    'get_detail_proforma_by_tenant',
    'get_famille_art_by_tenant'
  ];
  
  for (const funcName of newFunctions) {
    try {
      console.log(`--- Test ${funcName} ---`);
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

testMissingFunctions();