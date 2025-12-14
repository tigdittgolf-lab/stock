// Test direct de l'API pour diagnostiquer l'erreur JSON
// Exécuter avec: bun run test-api-directly.ts

async function testAPIDirectly() {
  console.log('🔍 Testing API endpoints directly...\n');

  const baseUrl = 'http://localhost:3005';
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': '2025_bu01'
  };

  try {
    // Test 1: Vérifier si le serveur backend répond
    console.log('1️⃣ Testing backend server...');
    try {
      const response = await fetch(`${baseUrl}/api/articles`, { headers });
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`   Response length: ${text.length} characters`);
      console.log(`   First 200 chars: ${text.substring(0, 200)}`);
      
      // Essayer de parser en JSON
      try {
        const json = JSON.parse(text);
        console.log('   ✅ Valid JSON response');
        console.log(`   Articles found: ${json.data?.length || 0}`);
      } catch (parseError) {
        console.log('   ❌ Invalid JSON response');
        console.log(`   Parse error: ${parseError.message}`);
      }
    } catch (fetchError) {
      console.log(`   ❌ Server not responding: ${fetchError.message}`);
      console.log('   🚨 Le serveur backend n\'est peut-être pas démarré !');
      return;
    }

    // Test 2: Tester l'endpoint spécifique pour l'article 1000
    console.log('\n2️⃣ Testing specific article endpoint...');
    try {
      const response = await fetch(`${baseUrl}/api/articles/1000`, { headers });
      console.log(`   Status: ${response.status}`);
      
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 300)}`);
      
      try {
        const json = JSON.parse(text);
        console.log('   ✅ Valid JSON for article 1000');
        console.log(`   Success: ${json.success}`);
        if (json.data) {
          console.log(`   Article: ${json.data.narticle} - ${json.data.designation}`);
        }
      } catch (parseError) {
        console.log('   ❌ Invalid JSON for article 1000');
      }
    } catch (fetchError) {
      console.log(`   ❌ Error fetching article: ${fetchError.message}`);
    }

    // Test 3: Tester l'API settings/families
    console.log('\n3️⃣ Testing families endpoint...');
    try {
      const response = await fetch(`${baseUrl}/api/settings/families`, { headers });
      console.log(`   Status: ${response.status}`);
      
      const text = await response.text();
      console.log(`   Response: ${text.substring(0, 200)}`);
      
      try {
        const json = JSON.parse(text);
        console.log('   ✅ Valid JSON for families');
        console.log(`   Families found: ${json.data?.length || 0}`);
      } catch (parseError) {
        console.log('   ❌ Invalid JSON for families');
      }
    } catch (fetchError) {
      console.log(`   ❌ Error fetching families: ${fetchError.message}`);
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

testAPIDirectly();