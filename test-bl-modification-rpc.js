// Test des fonctions RPC pour la modification des BL
const API_BASE_URL = 'http://localhost:3005/api';

async function testBLModificationRPC() {
  try {
    console.log('🧪 Testing BL modification RPC functions...');
    
    // Test 1: Vérifier si les fonctions RPC existent
    console.log('\n1. Testing RPC function existence...');
    
    const testResponse = await fetch(`${API_BASE_URL}/sales/test-exec-sql`, {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const testResult = await testResponse.json();
    console.log('📊 exec_sql test:', testResult);
    
    // Test 2: Tester la fonction update_bl
    console.log('\n2. Testing update_bl function...');
    
    const updateTestResponse = await fetch(`${API_BASE_URL}/sales/test-bl-rpc-functions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        testFunction: 'update_bl',
        blId: 5
      })
    });
    
    if (updateTestResponse.ok) {
      const updateResult = await updateTestResponse.json();
      console.log('📊 update_bl test:', updateResult);
    } else {
      console.log('❌ update_bl test failed:', updateTestResponse.status);
    }
    
    // Test 3: Tester une modification réelle de BL 5
    console.log('\n3. Testing real BL modification...');
    
    const modificationData = {
      Nclient: "415",
      date_fact: "2025-01-12",
      detail_bl: [
        {
          narticle: "142",
          qte: 10, // Changer de 5 à 10
          prix: 200.00,
          tva: 19
        }
      ]
    };
    
    const modifyResponse = await fetch(`${API_BASE_URL}/sales/delivery-notes/5`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify(modificationData)
    });
    
    if (modifyResponse.ok) {
      const modifyResult = await modifyResponse.json();
      console.log('✅ BL modification result:', modifyResult);
    } else {
      const errorText = await modifyResponse.text();
      console.log('❌ BL modification failed:', modifyResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Exécuter le test
testBLModificationRPC();