/**
 * Test pour vérifier que la migration utilise les vraies données Supabase
 * et non des données de test générées
 */

console.log('🧪 Test de migration des vraies données Supabase');

// Configuration de test
const testConfig = {
  source: {
    type: 'supabase',
    name: 'Supabase Production',
    supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY
  },
  target: {
    type: 'postgresql',
    name: 'PostgreSQL Local',
    host: 'localhost',
    port: 5432,
    database: 'stock_local',
    username: 'postgres',
    password: 'postgres'
  }
};

async function testRealDataMigration() {
  try {
    console.log('📊 Test 1: Vérification des données Supabase réelles');
    
    // Test direct avec Supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(testConfig.source.supabaseUrl, testConfig.source.supabaseKey);
    
    // Tester l'accès direct aux tables avec la nouvelle syntaxe
    console.log('🔍 Test accès direct table: 2025_bu01_article');
    const { data: articles, error: articlesError } = await supabase
      .from('2025_bu01_article')
      .select('*')
      .limit(5);
    
    if (articlesError) {
      console.error('❌ Erreur accès table articles:', articlesError.message);
    } else {
      console.log('✅ Articles trouvés:', articles?.length || 0);
      if (articles && articles.length > 0) {
        console.log('📋 Premier article:', articles[0]);
      }
    }
    
    console.log('🔍 Test accès direct table: 2025_bu01_client');
    const { data: clients, error: clientsError } = await supabase
      .from('2025_bu01_client')
      .select('*')
      .limit(5);
    
    if (clientsError) {
      console.error('❌ Erreur accès table clients:', clientsError.message);
    } else {
      console.log('✅ Clients trouvés:', clients?.length || 0);
      if (clients && clients.length > 0) {
        console.log('📋 Premier client:', clients[0]);
      }
    }
    
  } catch (error) {
    console.error('💥 Erreur test:', error);
  }
}

// Exécuter le test
testRealDataMigration();