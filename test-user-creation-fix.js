const BASE_URL = 'https://frontend-iota-six-72.vercel.app';

async function testUserCreation() {
  console.log('🧪 Test de création d\'utilisateur avec fix password_hash\n');

  // Données de test
  const testUser = {
    username: `testuser_${Date.now()}`,
    email: `test${Date.now()}@example.com`,
    password: 'TestPassword123!',
    full_name: 'Test User',
    role: 'user',
    business_units: [1]
  };

  console.log('📝 Création utilisateur:', {
    ...testUser,
    password: '***'
  });

  try {
    const response = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(testUser)
    });

    const result = await response.json();

    console.log('\n📊 Résultat:');
    console.log('Status:', response.status);
    console.log('Success:', result.success);
    
    if (result.success) {
      console.log('✅ Utilisateur créé avec succès!');
      console.log('ID:', result.data?.id);
      console.log('Username:', result.data?.username);
      console.log('Email:', result.data?.email);
      console.log('Role:', result.data?.role);
      
      // Test de récupération
      console.log('\n🔍 Test de récupération de l\'utilisateur...');
      const getResponse = await fetch(`${BASE_URL}/api/admin/users/${result.data.id}`);
      const getResult = await getResponse.json();
      
      if (getResult.success) {
        console.log('✅ Utilisateur récupéré avec succès!');
        console.log('Password hash présent:', !!getResult.data?.password_hash);
      } else {
        console.log('❌ Erreur récupération:', getResult.error);
      }
      
    } else {
      console.log('❌ Erreur création:', result.error);
      if (result.details) {
        console.log('Détails:', result.details);
      }
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testUserCreation();
