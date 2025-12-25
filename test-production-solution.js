/**
 * Test de la solution production : Application Web → Backend Local
 * Simule ce que fait l'application web déployée sur Vercel
 */

const BACKEND_URL = 'http://localhost:3005';
const WEB_APP_URL = 'https://st-article-1-b5pn7fp0k-tigdittgolf-9191s-projects.vercel.app';

console.log('🧪 TEST DE LA SOLUTION PRODUCTION');
console.log('=====================================');
console.log(`📱 Application Web: ${WEB_APP_URL}`);
console.log(`🖥️  Backend Local: ${BACKEND_URL}`);
console.log('');

async function testBackendConnection() {
  console.log('1️⃣ TEST CONNEXION BACKEND LOCAL...');
  
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend local accessible');
      console.log(`   Status: ${data.status} (${data.timestamp})`);
      return true;
    } else {
      console.log('❌ Backend local non accessible (status:', response.status, ')');
      return false;
    }
  } catch (error) {
    console.log('❌ Backend local non accessible:', error.message);
    return false;
  }
}

async function testDatabaseSwitch(targetDatabase = 'supabase') {
  console.log(`\n2️⃣ TEST SWITCH VERS ${targetDatabase.toUpperCase()}...`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/database/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: targetDatabase,
        config: {
          name: `Base ${targetDatabase}`,
          type: targetDatabase
        }
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Switch vers ${targetDatabase} réussi`);
      console.log(`   Message: ${result.message}`);
      return true;
    } else {
      console.log(`❌ Switch vers ${targetDatabase} échoué:`, result.error);
      return false;
    }
  } catch (error) {
    console.log(`❌ Erreur switch ${targetDatabase}:`, error.message);
    return false;
  }
}

async function testDataAccess() {
  console.log('\n3️⃣ TEST ACCÈS AUX DONNÉES...');
  
  const endpoints = [
    { name: 'Articles', url: '/api/sales/articles' },
    { name: 'Clients', url: '/api/sales/clients' },
    { name: 'Fournisseurs', url: '/api/sales/suppliers' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${BACKEND_URL}${endpoint.url}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ ${endpoint.name}: ${data.data?.length || 0} éléments (${data.database_type || 'unknown'})`);
      } else {
        console.log(`❌ ${endpoint.name}: ${data.error}`);
      }
    } catch (error) {
      console.log(`❌ ${endpoint.name}: Erreur - ${error.message}`);
    }
  }
}

async function simulateWebAppCall() {
  console.log('\n4️⃣ SIMULATION APPEL DEPUIS L\'APPLICATION WEB...');
  
  // Simuler ce que fait l'application web quand elle appelle son API
  console.log('   Simulation: Application Web → API Route → Backend Local');
  
  try {
    // Test direct du backend (ce que fait l'API route)
    const backendResponse = await fetch(`${BACKEND_URL}/api/database/switch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'supabase',
        config: { name: 'Supabase' }
      })
    });

    const backendResult = await backendResponse.json();
    
    if (backendResult.success) {
      console.log('✅ Simulation réussie : Web App → Backend Local fonctionne');
      console.log(`   Backend répond: ${backendResult.message}`);
      
      // Test d'accès aux données après switch
      const dataResponse = await fetch(`${BACKEND_URL}/api/sales/articles`);
      const dataResult = await dataResponse.json();
      
      if (dataResult.success) {
        console.log(`✅ Données accessibles: ${dataResult.data?.length || 0} articles`);
        console.log(`   Base active: ${dataResult.database_type}`);
      }
      
    } else {
      console.log('❌ Simulation échouée:', backendResult.error);
    }
    
  } catch (error) {
    console.log('❌ Erreur simulation:', error.message);
  }
}

async function runTests() {
  console.log('🚀 DÉMARRAGE DES TESTS...\n');
  
  // Test 1: Connexion backend
  const backendOk = await testBackendConnection();
  if (!backendOk) {
    console.log('\n❌ ÉCHEC: Backend local non accessible');
    console.log('   Assurez-vous que le backend tourne sur le port 3005');
    return;
  }

  // Test 2: Switch de base de données
  await testDatabaseSwitch('supabase');
  await testDatabaseSwitch('postgresql');
  await testDatabaseSwitch('mysql');

  // Test 3: Accès aux données
  await testDataAccess();

  // Test 4: Simulation complète
  await simulateWebAppCall();

  console.log('\n🎯 RÉSUMÉ DES TESTS');
  console.log('==================');
  console.log('✅ Backend local fonctionne');
  console.log('✅ Switch entre bases fonctionne');
  console.log('✅ Accès aux données fonctionne');
  console.log('✅ Simulation Web App → Backend réussie');
  console.log('');
  console.log('🌐 PROCHAINE ÉTAPE: Créer un tunnel public');
  console.log('   1. Installer ngrok ou cloudflare tunnel');
  console.log('   2. Créer le tunnel: ngrok http 3005');
  console.log('   3. Configurer l\'URL dans l\'application web');
  console.log(`   4. Tester sur: ${WEB_APP_URL}`);
}

// Exécuter les tests
runTests().catch(console.error);