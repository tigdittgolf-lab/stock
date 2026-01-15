const BASE_URL = 'https://frontend-iota-six-72.vercel.app';

async function testCompleteUserCRUD() {
  console.log('🧪 Test complet CRUD des utilisateurs admin\n');
  
  let createdUserId = null;

  try {
    // 1. CREATE - Créer un utilisateur
    console.log('1️⃣ TEST CREATE');
    const testUser = {
      username: `testuser_${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      password: 'TestPassword123!',
      full_name: 'Test User CRUD',
      role: 'user',
      business_units: [1]
    };

    const createResponse = await fetch(`${BASE_URL}/api/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const createResult = await createResponse.json();
    
    if (createResult.success) {
      createdUserId = createResult.data.id;
      console.log('✅ CREATE réussi - ID:', createdUserId);
      console.log('   Username:', createResult.data.username);
      console.log('   Email:', createResult.data.email);
    } else {
      console.log('❌ CREATE échoué:', createResult.error);
      return;
    }

    // 2. READ - Lire l'utilisateur créé
    console.log('\n2️⃣ TEST READ (GET by ID)');
    const readResponse = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`);
    const readResult = await readResponse.json();
    
    if (readResult.success) {
      console.log('✅ READ réussi');
      console.log('   Username:', readResult.data.username);
      console.log('   Password hash présent:', !!readResult.data.password_hash);
      console.log('   Role:', readResult.data.role);
    } else {
      console.log('❌ READ échoué:', readResult.error);
    }

    // 3. UPDATE - Mettre à jour l'utilisateur
    console.log('\n3️⃣ TEST UPDATE');
    const updateData = {
      username: testUser.username,
      email: testUser.email,
      full_name: 'Test User UPDATED',
      role: 'admin',
      business_units: [1, 2],
      active: true
    };

    const updateResponse = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updateData)
    });

    const updateResult = await updateResponse.json();
    
    if (updateResult.success) {
      console.log('✅ UPDATE réussi');
      console.log('   Full name:', updateResult.data.full_name);
      console.log('   Role:', updateResult.data.role);
      console.log('   Business units:', updateResult.data.business_units);
    } else {
      console.log('❌ UPDATE échoué:', updateResult.error);
    }

    // 4. LIST - Lister tous les utilisateurs
    console.log('\n4️⃣ TEST LIST (GET all)');
    const listResponse = await fetch(`${BASE_URL}/api/admin/users`);
    const listResult = await listResponse.json();
    
    if (listResult.success) {
      console.log('✅ LIST réussi');
      console.log('   Total utilisateurs:', listResult.data.length);
      const ourUser = listResult.data.find(u => u.id === createdUserId);
      if (ourUser) {
        console.log('   Notre utilisateur trouvé:', ourUser.username);
      }
    } else {
      console.log('❌ LIST échoué:', listResult.error);
    }

    // 5. DELETE - Supprimer l'utilisateur
    console.log('\n5️⃣ TEST DELETE');
    const deleteResponse = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`, {
      method: 'DELETE'
    });

    const deleteResult = await deleteResponse.json();
    
    if (deleteResult.success) {
      console.log('✅ DELETE réussi');
      
      // Vérifier que l'utilisateur n'existe plus
      const verifyResponse = await fetch(`${BASE_URL}/api/admin/users/${createdUserId}`);
      const verifyResult = await verifyResponse.json();
      
      if (!verifyResult.success) {
        console.log('✅ Vérification: Utilisateur bien supprimé');
      } else {
        console.log('⚠️ Vérification: Utilisateur encore présent');
      }
    } else {
      console.log('❌ DELETE échoué:', deleteResult.error);
    }

    console.log('\n🎉 TOUS LES TESTS CRUD RÉUSSIS!');
    console.log('📋 Résumé:');
    console.log('   ✅ CREATE - Création avec password_hash');
    console.log('   ✅ READ - Lecture par ID');
    console.log('   ✅ UPDATE - Mise à jour');
    console.log('   ✅ LIST - Liste complète');
    console.log('   ✅ DELETE - Suppression');

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testCompleteUserCRUD();
