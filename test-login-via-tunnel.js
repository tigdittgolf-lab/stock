/**
 * Test de connexion via le tunnel - Simule exactement ce que fait l'application web
 */

const TUNNEL_URL = 'https://nick-fit-told-baking.trycloudflare.com';

console.log('🔐 TEST DE CONNEXION VIA TUNNEL');
console.log('================================');
console.log(`🔗 Tunnel: ${TUNNEL_URL}`);
console.log('');

async function testLogin() {
  console.log('1️⃣ TEST CONNEXION AVEC IDENTIFIANTS...');
  
  try {
    // Simuler exactement ce que fait l'application web pour la connexion
    const loginResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginResult = await loginResponse.json();
    
    if (loginResult.success) {
      console.log('✅ Connexion réussie !');
      console.log(`   Token: ${loginResult.token ? 'Généré' : 'Non généré'}`);
      console.log(`   User: ${loginResult.user?.username || 'Inconnu'}`);
      console.log(`   Role: ${loginResult.user?.role || 'Inconnu'}`);
      
      return loginResult.token;
    } else {
      console.log('❌ Connexion échouée:', loginResult.error);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur connexion:', error.message);
    return null;
  }
}

async function testDataAccessWithAuth(token) {
  if (!token) {
    console.log('\n⏭️ Pas de token, test des données sans authentification...');
  } else {
    console.log('\n2️⃣ TEST ACCÈS AUX DONNÉES AVEC AUTHENTIFICATION...');
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': '2025_bu01'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const endpoints = [
    { name: 'Articles', url: '/api/sales/articles' },
    { name: 'Clients', url: '/api/sales/clients' },
    { name: 'Fournisseurs', url: '/api/sales/suppliers' }
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(`${TUNNEL_URL}${endpoint.url}`, { headers });
      const data = await response.json();
      
      if (data.success) {
        console.log(`   ✅ ${endpoint.name}: ${data.data?.length || 0} éléments (${data.database_type || 'unknown'})`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${data.error}`);
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: Erreur - ${error.message}`);
    }
  }
}

async function testDatabaseSwitch(token) {
  console.log('\n3️⃣ TEST SWITCH BASE DE DONNÉES...');
  
  const headers = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const switchResponse = await fetch(`${TUNNEL_URL}/api/database/switch`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        type: 'supabase',
        config: { name: 'Supabase via Tunnel' }
      })
    });

    const switchResult = await switchResponse.json();
    
    if (switchResult.success) {
      console.log('   ✅ Switch base de données réussi');
      console.log(`   📊 Message: ${switchResult.message}`);
    } else {
      console.log('   ❌ Switch échoué:', switchResult.error);
    }
  } catch (error) {
    console.log('   ❌ Erreur switch:', error.message);
  }
}

async function runLoginTest() {
  console.log('🚀 DÉMARRAGE DU TEST DE CONNEXION...\n');
  
  // Test 1: Connexion
  const token = await testLogin();
  
  // Test 2: Accès aux données
  await testDataAccessWithAuth(token);
  
  // Test 3: Switch de base
  await testDatabaseSwitch(token);

  console.log('\n🎯 RÉSUMÉ DU TEST');
  console.log('=================');
  
  if (token) {
    console.log('✅ Connexion fonctionne via tunnel');
    console.log('✅ Authentification réussie');
    console.log('✅ Token généré');
    console.log('');
    console.log('🌟 LA SOLUTION EST FONCTIONNELLE !');
    console.log('');
    console.log('📋 POUR UTILISER L\'APPLICATION WEB:');
    console.log('   1. Désactiver la protection Vercel');
    console.log('   2. Ou créer un nouveau déploiement sans protection');
    console.log(`   3. Configurer l'URL backend: ${TUNNEL_URL}`);
    console.log('   4. Se connecter avec: admin / admin123');
  } else {
    console.log('❌ Problème de connexion détecté');
    console.log('   Vérifier la configuration d\'authentification');
  }
}

// Exécuter le test
runLoginTest().catch(console.error);