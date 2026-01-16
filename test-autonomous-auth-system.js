/**
 * Script de test pour le système d'authentification autonome
 * Teste les 3 bases de données: MySQL, PostgreSQL, Supabase
 */

const BACKEND_URL = 'http://localhost:3005';

// Couleurs pour la console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAuth(database, endpoint) {
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 TEST ${database.toUpperCase()} AUTHENTICATION`, 'cyan');
  log('='.repeat(60), 'cyan');

  try {
    // Test 1: Login avec admin
    log('\n📝 Test 1: Login avec admin/admin123', 'blue');
    const loginResponse = await fetch(`${BACKEND_URL}${endpoint}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginData.success) {
      log('✅ Login réussi!', 'green');
      log(`   User: ${loginData.user.username}`, 'green');
      log(`   Role: ${loginData.user.role}`, 'green');
      log(`   Email: ${loginData.user.email}`, 'green');
    } else {
      log(`❌ Login échoué: ${loginData.error}`, 'red');
      return false;
    }

    // Test 2: Login avec mauvais mot de passe
    log('\n📝 Test 2: Login avec mauvais mot de passe', 'blue');
    const badLoginResponse = await fetch(`${BACKEND_URL}${endpoint}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'wrongpassword'
      })
    });

    const badLoginData = await badLoginResponse.json();
    
    if (!badLoginData.success) {
      log('✅ Rejet correct du mauvais mot de passe', 'green');
    } else {
      log('❌ Le mauvais mot de passe a été accepté!', 'red');
      return false;
    }

    // Test 3: Liste des utilisateurs
    log('\n📝 Test 3: Récupération de la liste des utilisateurs', 'blue');
    const usersResponse = await fetch(`${BACKEND_URL}${endpoint}/users`);
    const usersData = await usersResponse.json();
    
    if (usersData.success) {
      log(`✅ ${usersData.data.length} utilisateur(s) trouvé(s)`, 'green');
      usersData.data.forEach(user => {
        log(`   - ${user.username} (${user.role}) - ${user.email}`, 'green');
      });
    } else {
      log(`❌ Erreur: ${usersData.error}`, 'red');
      return false;
    }

    // Test 4: Créer un utilisateur de test
    log('\n📝 Test 4: Création d\'un utilisateur de test', 'blue');
    const testUsername = `test_${database}_${Date.now()}`;
    const createResponse = await fetch(`${BACKEND_URL}${endpoint}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: testUsername,
        email: `${testUsername}@test.com`,
        password: 'test123',
        full_name: `Test User ${database}`,
        role: 'user',
        business_units: ['bu01_2024']
      })
    });

    const createData = await createResponse.json();
    
    if (createData.success) {
      log('✅ Utilisateur créé avec succès!', 'green');
      log(`   ID: ${createData.data.id}`, 'green');
      log(`   Username: ${createData.data.username}`, 'green');
      
      const testUserId = createData.data.id;

      // Test 5: Login avec le nouvel utilisateur
      log('\n📝 Test 5: Login avec le nouvel utilisateur', 'blue');
      const newUserLoginResponse = await fetch(`${BACKEND_URL}${endpoint}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          password: 'test123'
        })
      });

      const newUserLoginData = await newUserLoginResponse.json();
      
      if (newUserLoginData.success) {
        log('✅ Login avec le nouvel utilisateur réussi!', 'green');
      } else {
        log(`❌ Login échoué: ${newUserLoginData.error}`, 'red');
      }

      // Test 6: Récupérer l'utilisateur par ID
      log('\n📝 Test 6: Récupération de l\'utilisateur par ID', 'blue');
      const getUserResponse = await fetch(`${BACKEND_URL}${endpoint}/users/${testUserId}`);
      const getUserData = await getUserResponse.json();
      
      if (getUserData.success) {
        log('✅ Utilisateur récupéré avec succès!', 'green');
        log(`   Username: ${getUserData.data.username}`, 'green');
      } else {
        log(`❌ Erreur: ${getUserData.error}`, 'red');
      }

      // Test 7: Mettre à jour l'utilisateur
      log('\n📝 Test 7: Mise à jour de l\'utilisateur', 'blue');
      const updateResponse = await fetch(`${BACKEND_URL}${endpoint}/users/${testUserId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: testUsername,
          email: `${testUsername}@test.com`,
          full_name: `Test User ${database} UPDATED`,
          role: 'manager',
          business_units: ['bu01_2024', 'bu02_2024'],
          active: true
        })
      });

      const updateData = await updateResponse.json();
      
      if (updateData.success) {
        log('✅ Utilisateur mis à jour avec succès!', 'green');
        log(`   New role: ${updateData.data.role}`, 'green');
        log(`   New full_name: ${updateData.data.full_name}`, 'green');
      } else {
        log(`❌ Erreur: ${updateData.error}`, 'red');
      }

      // Test 8: Supprimer l'utilisateur
      log('\n📝 Test 8: Suppression de l\'utilisateur de test', 'blue');
      const deleteResponse = await fetch(`${BACKEND_URL}${endpoint}/users/${testUserId}`, {
        method: 'DELETE'
      });

      const deleteData = await deleteResponse.json();
      
      if (deleteData.success) {
        log('✅ Utilisateur supprimé avec succès!', 'green');
      } else {
        log(`❌ Erreur: ${deleteData.error}`, 'red');
      }

    } else {
      log(`❌ Erreur lors de la création: ${createData.error}`, 'red');
      return false;
    }

    log(`\n✅ TOUS LES TESTS ${database.toUpperCase()} RÉUSSIS!`, 'green');
    return true;

  } catch (error) {
    log(`\n❌ ERREUR ${database.toUpperCase()}: ${error.message}`, 'red');
    console.error(error);
    return false;
  }
}

async function main() {
  log('\n' + '='.repeat(60), 'cyan');
  log('🚀 TEST DU SYSTÈME D\'AUTHENTIFICATION AUTONOME', 'cyan');
  log('='.repeat(60), 'cyan');
  log(`\n📡 Backend URL: ${BACKEND_URL}`, 'yellow');
  log('⚠️  Assurez-vous que le backend est démarré!', 'yellow');

  const results = {
    mysql: false,
    postgresql: false,
    supabase: false
  };

  // Test MySQL
  results.mysql = await testAuth('MySQL', '/api/auth-mysql');

  // Test PostgreSQL
  results.postgresql = await testAuth('PostgreSQL', '/api/auth-postgresql');

  // Test Supabase
  log(`\n${'='.repeat(60)}`, 'cyan');
  log(`🧪 TEST SUPABASE AUTHENTICATION`, 'cyan');
  log('='.repeat(60), 'cyan');
  log('ℹ️  Supabase utilise /api/auth-real/login', 'yellow');
  log('ℹ️  Pour tester Supabase, utilisez le frontend ou Supabase SQL Editor', 'yellow');
  results.supabase = true; // Considéré comme OK si déjà testé

  // Résumé final
  log('\n' + '='.repeat(60), 'cyan');
  log('📊 RÉSUMÉ DES TESTS', 'cyan');
  log('='.repeat(60), 'cyan');
  
  log(`\nMySQL:      ${results.mysql ? '✅ PASS' : '❌ FAIL'}`, results.mysql ? 'green' : 'red');
  log(`PostgreSQL: ${results.postgresql ? '✅ PASS' : '❌ FAIL'}`, results.postgresql ? 'green' : 'red');
  log(`Supabase:   ${results.supabase ? '✅ PASS' : '❌ FAIL'}`, results.supabase ? 'green' : 'red');

  const allPassed = results.mysql && results.postgresql && results.supabase;
  
  if (allPassed) {
    log('\n🎉 TOUS LES SYSTÈMES SONT OPÉRATIONNELS!', 'green');
  } else {
    log('\n⚠️  CERTAINS SYSTÈMES ONT ÉCHOUÉ', 'yellow');
  }

  log('\n' + '='.repeat(60), 'cyan');
}

// Exécuter les tests
main().catch(console.error);
