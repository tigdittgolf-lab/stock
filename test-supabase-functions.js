// Script pour tester les fonctions RPC disponibles dans Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseUrl.includes('supabase.co') || !supabaseKey.startsWith('eyJ')) {
  console.log('❌ Veuillez configurer SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseFunctions() {
  console.log('🔍 Test des fonctions RPC Supabase disponibles...\n');

  const functionsToTest = [
    'get_bl_details_by_id',
    'get_bl_details',
    'get_bl_details_by_tenant',
    'get_bl_complete_by_id',
    'get_bl_client_info',
    'get_bl_list_by_tenant',
    'get_bl_by_tenant'
  ];

  for (const funcName of functionsToTest) {
    try {
      console.log(`📋 Test: ${funcName}`);
      
      const { data, error } = await supabase.rpc(funcName, {
        p_tenant: '2025_bu01',
        p_nfact: 4
      });

      if (error) {
        console.log(`   ❌ Erreur: ${error.message}`);
      } else {
        console.log(`   ✅ Succès: ${data ? 'Données retournées' : 'Pas de données'}`);
        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`   📊 ${data.length} enregistrements trouvés`);
        }
      }
    } catch (err) {
      console.log(`   ❌ Exception: ${err.message}`);
    }
    console.log('');
  }

  // Test spécial pour lister toutes les fonctions disponibles
  try {
    console.log('🔍 Tentative de récupération de la liste des fonctions...');
    const { data, error } = await supabase
      .from('information_schema.routines')
      .select('routine_name')
      .eq('routine_schema', 'public')
      .like('routine_name', '%bl%');

    if (data && data.length > 0) {
      console.log('📋 Fonctions contenant "bl" trouvées:');
      data.forEach(func => console.log(`   - ${func.routine_name}`));
    }
  } catch (err) {
    console.log('⚠️ Impossible de lister les fonctions via information_schema');
  }
}

testSupabaseFunctions().catch(console.error);