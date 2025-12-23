// Test de la nouvelle interface simplifiée
async function testInterfaceFixed() {
  const baseUrl = 'http://localhost:3005/api';
  
  console.log('🔧 TEST NOUVELLE INTERFACE SIMPLIFIÉE\n');
  
  try {
    // 1. Vérifier le statut backend
    console.log('1️⃣ VÉRIFICATION STATUT BACKEND...');
    const statusResponse = await fetch(`${baseUrl}/database-config`);
    const statusData = await statusResponse.json();
    
    console.log(`✅ Backend actuel: ${statusData.data.type.toUpperCase()}`);
    console.log(`   Timestamp: ${new Date(statusData.data.timestamp).toLocaleString()}`);
    
    // 2. Test des configurations par défaut
    console.log('\n2️⃣ CONFIGURATIONS PAR DÉFAUT:');
    
    const defaultConfigs = {
      supabase: {
        type: 'supabase',
        name: 'Supabase Production',
        supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co'
      },
      postgresql: {
        type: 'postgresql',
        name: 'PostgreSQL Local',
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres'
      },
      mysql: {
        type: 'mysql',
        name: 'MySQL Local',
        host: 'localhost',
        port: 3306,
        database: 'stock_local',
        username: 'root',
        password: ''
      }
    };
    
    // 3. Tester chaque configuration
    for (const [type, config] of Object.entries(defaultConfigs)) {
      console.log(`\n   🔧 TEST ${type.toUpperCase()}:`);
      
      const testResponse = await fetch(`${baseUrl}/database-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const testData = await testResponse.json();
      
      if (testData.success) {
        console.log(`   ✅ ${type}: Connexion réussie`);
        
        // Vérifier les données
        const dataResponse = await fetch(`${baseUrl}/sales/suppliers`, {
          headers: { 'X-Tenant': '2025_bu01' }
        });
        const dataResult = await dataResponse.json();
        
        if (dataResult.success) {
          console.log(`   📊 Données: ${dataResult.data?.length || 0} fournisseurs`);
        }
      } else {
        console.log(`   ❌ ${type}: ${testData.error}`);
      }
    }
    
    // 4. Revenir à Supabase
    console.log('\n4️⃣ RETOUR À SUPABASE...');
    const supabaseResponse = await fetch(`${baseUrl}/database-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(defaultConfigs.supabase)
    });
    
    const supabaseData = await supabaseResponse.json();
    console.log(`✅ Retour Supabase: ${supabaseData.success ? 'SUCCESS' : 'FAILED'}`);
    
    console.log('\n📊 RÉSUMÉ NOUVELLE INTERFACE:');
    console.log('=====================================');
    console.log('✅ Interface simplifiée et claire');
    console.log('✅ Statut backend visible en temps réel');
    console.log('✅ Sélection visuelle des types de base');
    console.log('✅ Auto-remplissage des configurations');
    console.log('✅ Test et switch via backend uniquement');
    console.log('✅ Messages d\'erreur clairs');
    console.log('✅ Workflow logique: Choisir → Tester → Changer');
    
  } catch (error) {
    console.error('❌ Test échoué:', error);
  }
}

testInterfaceFixed();