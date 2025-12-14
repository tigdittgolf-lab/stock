// Test de modification de client
// Exécuter avec: bun run test-client-update.ts

async function testClientUpdate() {
  console.log('🧪 Testing client update...\n');

  const baseUrl = 'http://localhost:3005';
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': '2025_bu01'
  };

  try {
    // Test 1: Récupérer un client existant
    console.log('1️⃣ Testing GET /api/sales/clients/CL01...');
    const getResponse = await fetch(`${baseUrl}/api/sales/clients/CL01`, { headers });
    console.log(`   Status: ${getResponse.status}`);
    
    const getText = await getResponse.text();
    try {
      const getJson = JSON.parse(getText);
      console.log(`   ✅ Valid JSON, client found: ${getJson.success}`);
      if (getJson.data) {
        console.log(`   Client: ${getJson.data.nclient} - ${getJson.data.raison_sociale}`);
      }
    } catch (e) {
      console.log(`   ❌ Invalid JSON: ${e.message}`);
      console.log(`   Response: ${getText.substring(0, 100)}`);
    }

    // Test 2: Modifier le client
    console.log('\n2️⃣ Testing PUT /api/sales/clients/CL01...');
    
    const updateData = {
      raison_sociale: 'SARL CLIENT MODIFIÉ',
      adresse: '456 Nouvelle Adresse, Oran',
      contact_person: 'Mohamed Nouveau',
      tel: '+213 41 XX XX XX',
      email: 'nouveau@client.dz',
      nrc: '16/00-7654321',
      i_fiscal: '0987654321',
      c_affaire_fact: 1000,
      c_affaire_bl: 2000
    };

    const putResponse = await fetch(`${baseUrl}/api/sales/clients/CL01`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updateData)
    });

    console.log(`   Status: ${putResponse.status}`);
    
    const putText = await putResponse.text();
    try {
      const putJson = JSON.parse(putText);
      console.log(`   ✅ Valid JSON response`);
      console.log(`   Success: ${putJson.success}`);
      console.log(`   Message: ${putJson.message || 'No message'}`);
      if (putJson.error) {
        console.log(`   Error: ${putJson.error}`);
      }
    } catch (e) {
      console.log(`   ❌ Invalid JSON: ${e.message}`);
      console.log(`   Response: ${putText.substring(0, 200)}`);
    }

    // Test 3: Vérifier que la modification a été appliquée
    console.log('\n3️⃣ Verifying update was applied...');
    
    const verifyResponse = await fetch(`${baseUrl}/api/sales/clients/CL01`, { headers });
    const verifyText = await verifyResponse.text();
    
    try {
      const verifyJson = JSON.parse(verifyText);
      if (verifyJson.success && verifyJson.data) {
        console.log(`   ✅ Updated client data:`);
        console.log(`   Raison sociale: ${verifyJson.data.raison_sociale}`);
        console.log(`   Adresse: ${verifyJson.data.adresse}`);
        console.log(`   Contact: ${verifyJson.data.contact_person}`);
      }
    } catch (e) {
      console.log(`   ❌ Could not verify update: ${e.message}`);
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testClientUpdate();