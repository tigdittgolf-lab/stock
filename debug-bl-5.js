// Script pour déboguer le BL 5 et voir s'il a des articles
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugBL5() {
  console.log('🔍 Debug du BL 5 dans le tenant 2025_bu01\n');

  // 1. Vérifier si le BL 5 existe
  try {
    console.log('📋 1. Vérification de l\'existence du BL 5...');
    const { data: blData, error: blError } = await supabase
      .from('2025_bu01.bl_vente')
      .select('*')
      .eq('nfact', 5)
      .single();

    if (blError) {
      console.log('❌ Erreur BL:', blError.message);
    } else if (blData) {
      console.log('✅ BL 5 trouvé:', blData);
    } else {
      console.log('⚠️ BL 5 non trouvé');
    }
  } catch (err) {
    console.log('❌ Exception BL:', err.message);
  }

  // 2. Vérifier les détails du BL 5
  try {
    console.log('\n📦 2. Vérification des détails du BL 5...');
    const { data: detailsData, error: detailsError } = await supabase
      .from('2025_bu01.detail_bl')
      .select('*')
      .eq('nfact', 5);

    if (detailsError) {
      console.log('❌ Erreur détails:', detailsError.message);
    } else if (detailsData && detailsData.length > 0) {
      console.log(`✅ ${detailsData.length} détails trouvés:`, detailsData);
    } else {
      console.log('⚠️ Aucun détail trouvé pour le BL 5');
    }
  } catch (err) {
    console.log('❌ Exception détails:', err.message);
  }

  // 3. Tester les fonctions RPC disponibles
  const rpcFunctions = [
    'get_bl_details_by_id',
    'get_bl_details', 
    'get_detail_bl_by_tenant',
    'get_bl_list_by_tenant'
  ];

  for (const funcName of rpcFunctions) {
    try {
      console.log(`\n🔧 3. Test RPC: ${funcName}`);
      const { data, error } = await supabase.rpc(funcName, {
        p_tenant: '2025_bu01',
        p_nfact: 5
      });

      if (error) {
        console.log(`   ❌ ${funcName}: ${error.message}`);
      } else {
        console.log(`   ✅ ${funcName}: ${data ? (Array.isArray(data) ? `${data.length} résultats` : 'Données retournées') : 'Pas de données'}`);
        if (data && Array.isArray(data) && data.length > 0) {
          console.log(`   📊 Premier résultat:`, data[0]);
        }
      }
    } catch (err) {
      console.log(`   ❌ ${funcName}: Exception - ${err.message}`);
    }
  }
}

debugBL5().catch(console.error);