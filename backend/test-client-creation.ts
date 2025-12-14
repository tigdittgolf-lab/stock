// Test de création de client
// Exécuter avec: bun run test-client-creation.ts

async function testClientCreation() {
  console.log('🧪 Testing client creation...\n');

  const baseUrl = 'http://localhost:3005';
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': '2025_bu01'
  };

  try {
    // Test 1: Vérifier l'endpoint GET clients
    console.log('1️⃣ Testing GET /api/sales/clients...');
    const getResponse = await fetch(`${baseUrl}/api/sales/clients`, { headers });
    console.log(`   Status: ${getResponse.status}`);
    
    const getText = await getResponse.text();
    try {
      const getJson = JSON.parse(getText);
      console.log(`   ✅ Valid JSON, clients found: ${getJson.data?.length || 0}`);
    } catch (e) {
      console.log(`   ❌ Invalid JSON: ${e.message}`);
      console.log(`   Response: ${getText.substring(0, 100)}`);
    }

    // Test 2: Tester la création d'un client
    console.log('\n2️⃣ Testing POST /api/sales/clients...');
    
    const testClient = {
      nclient: 'CLI001',
      raison_sociale: 'SARL TEST CLIENT',
      adresse: '123 Rue de Test, Alger',
      contact_person: 'Ahmed Testeur',
      tel: '+213 21 XX XX XX',
      email: 'test@client.dz',
      nrc: '16/00-1234567',
      i_fiscal: '1234567890',
      c_affaire_fact: 0,
      c_affaire_bl: 0
    };

    const postResponse = await fetch(`${baseUrl}/api/sales/clients`, {
      method: 'POST',
      headers,
      body: JSON.stringify(testClient)
    });

    console.log(`   Status: ${postResponse.status}`);
    
    const postText = await postResponse.text();
    try {
      const postJson = JSON.parse(postText);
      console.log(`   ✅ Valid JSON response`);
      console.log(`   Success: ${postJson.success}`);
      console.log(`   Message: ${postJson.message || 'No message'}`);
      if (postJson.error) {
        console.log(`   Error: ${postJson.error}`);
      }
    } catch (e) {
      console.log(`   ❌ Invalid JSON: ${e.message}`);
      console.log(`   Response: ${postText.substring(0, 200)}`);
    }

    // Test 3: Vérifier si le client existe maintenant
    console.log('\n3️⃣ Testing GET /api/sales/clients/CLI001...');
    
    const checkResponse = await fetch(`${baseUrl}/api/sales/clients/CLI001`, { headers });
    console.log(`   Status: ${checkResponse.status}`);
    
    const checkText = await checkResponse.text();
    try {
      const checkJson = JSON.parse(checkText);
      console.log(`   ✅ Valid JSON response`);
      console.log(`   Client found: ${checkJson.success}`);
      if (checkJson.data) {
        console.log(`   Client: ${checkJson.data.nclient} - ${checkJson.data.raison_sociale}`);
      }
    } catch (e) {
      console.log(`   ❌ Invalid JSON: ${e.message}`);
      console.log(`   Response: ${checkText.substring(0, 100)}`);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testClientCreation();