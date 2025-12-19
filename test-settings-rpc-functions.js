// =====================================================
// TEST DES FONCTIONS RPC POUR LES PARAMÈTRES
// =====================================================

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDQ0NzU5MSwiZXhwIjoyMDUwMDIzNTkxfQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSettingsRPCFunctions() {
  console.log('🔍 Test des fonctions RPC pour les paramètres...\n');
  
  const tenant = '2025_bu01';
  const results = {
    tenant: tenant,
    supabaseUrl: supabaseUrl,
    tests: {}
  };

  // Test 1: get_families
  console.log('📋 Test 1: get_families');
  try {
    const { data, error } = await supabase.rpc('get_families', {
      p_tenant: tenant
    });
    
    if (error) {
      console.log('❌ Erreur get_families:', error.message);
      results.tests.get_families = {
        success: false,
        error: error.message,
        data: null
      };
    } else {
      console.log('✅ get_families réussie:', data);
      results.tests.get_families = {
        success: true,
        data: data,
        type: typeof data
      };
    }
  } catch (err) {
    console.log('❌ Exception get_families:', err.message);
    results.tests.get_families = {
      success: false,
      error: err.message,
      data: null
    };
  }

  // Test 2: get_tenant_activite
  console.log('\n🏢 Test 2: get_tenant_activite');
  try {
    const { data, error } = await supabase.rpc('get_tenant_activite', {
      p_tenant: tenant
    });
    
    if (error) {
      console.log('❌ Erreur get_tenant_activite:', error.message);
      results.tests.get_tenant_activite = {
        success: false,
        error: error.message,
        data: null
      };
    } else {
      console.log('✅ get_tenant_activite réussie:', data);
      results.tests.get_tenant_activite = {
        success: true,
        data: data,
        type: typeof data
      };
    }
  } catch (err) {
    console.log('❌ Exception get_tenant_activite:', err.message);
    results.tests.get_tenant_activite = {
      success: false,
      error: err.message,
      data: null
    };
  }

  // Test 3: Vérifier les données des articles pour les familles
  console.log('\n📦 Test 3: Vérification des articles pour familles');
  try {
    const { data, error } = await supabase.rpc('get_articles', {
      p_tenant: tenant
    });
    
    if (error) {
      console.log('❌ Erreur get_articles:', error.message);
      results.tests.articles_for_families = {
        success: false,
        error: error.message
      };
    } else {
      console.log('✅ Articles récupérés:', data?.length || 0);
      const families = [...new Set(data?.map(art => art.famille).filter(f => f))];
      console.log('📋 Familles trouvées dans les articles:', families);
      results.tests.articles_for_families = {
        success: true,
        count: data?.length || 0,
        families: families
      };
    }
  } catch (err) {
    console.log('❌ Exception get_articles:', err.message);
    results.tests.articles_for_families = {
      success: false,
      error: err.message
    };
  }

  // Test 4: Vérifier la table activite
  console.log('\n🏢 Test 4: Vérification de la table activite');
  try {
    const { data, error } = await supabase
      .from('2025_bu01.activite')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Erreur accès table activite:', error.message);
      results.tests.activite_table = {
        success: false,
        error: error.message,
        note: 'Accès direct à la table (peut ne pas fonctionner)'
      };
    } else {
      console.log('✅ Table activite accessible:', data);
      results.tests.activite_table = {
        success: true,
        data: data,
        count: data?.length || 0
      };
    }
  } catch (err) {
    console.log('❌ Exception table activite:', err.message);
    results.tests.activite_table = {
      success: false,
      error: err.message,
      note: 'Accès direct à la table (peut ne pas fonctionner)'
    };
  }

  console.log('\n📊 RÉSUMÉ DES TESTS:');
  console.log(JSON.stringify(results, null, 2));

  return results;
}

// Exécuter les tests
testSettingsRPCFunctions()
  .then(results => {
    console.log('\n✅ Tests terminés');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Erreur lors des tests:', error);
    process.exit(1);
  });