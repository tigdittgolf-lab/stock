// Simuler exactement les requêtes de la page de modification d'article
// Exécuter avec: bun run simulate-edit-page-requests.ts

async function simulateEditPageRequests() {
  console.log('🔍 Simulating edit page requests...\n');

  const baseUrl = 'http://localhost:3005';
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': '2025_bu01'
  };

  try {
    // Simuler les requêtes exactes de la page edit-article
    console.log('1️⃣ Simulating loadFormData requests (parallel)...');
    
    const promises = [
      fetch(`${baseUrl}/api/settings/families`, { headers }),
      fetch(`${baseUrl}/api/sales/suppliers`, { headers })
    ];

    const responses = await Promise.all(promises);
    
    console.log('   Families response status:', responses[0].status);
    console.log('   Suppliers response status:', responses[1].status);

    // Lire les réponses
    const familiesText = await responses[0].text();
    const suppliersText = await responses[1].text();

    console.log('   Families response length:', familiesText.length);
    console.log('   Suppliers response length:', suppliersText.length);

    // Tester le parsing JSON
    try {
      const familiesJson = JSON.parse(familiesText);
      console.log('   ✅ Families JSON valid, families count:', familiesJson.data?.length || 0);
    } catch (e) {
      console.log('   ❌ Families JSON invalid:', e.message);
      console.log('   First 100 chars:', familiesText.substring(0, 100));
    }

    try {
      const suppliersJson = JSON.parse(suppliersText);
      console.log('   ✅ Suppliers JSON valid, suppliers count:', suppliersJson.data?.length || 0);
    } catch (e) {
      console.log('   ❌ Suppliers JSON invalid:', e.message);
      console.log('   First 100 chars:', suppliersText.substring(0, 100));
    }

    // 2. Simuler la requête pour l'article spécifique
    console.log('\n2️⃣ Simulating loadArticleData request...');
    
    const articleResponse = await fetch(`${baseUrl}/api/articles/1000`, { headers });
    console.log('   Article response status:', articleResponse.status);
    
    const articleText = await articleResponse.text();
    console.log('   Article response length:', articleText.length);
    
    try {
      const articleJson = JSON.parse(articleText);
      console.log('   ✅ Article JSON valid');
      console.log('   Article found:', articleJson.success);
      if (articleJson.data) {
        console.log('   Article ID:', articleJson.data.narticle);
        console.log('   Article designation:', articleJson.data.designation);
      }
    } catch (e) {
      console.log('   ❌ Article JSON invalid:', e.message);
      console.log('   First 100 chars:', articleText.substring(0, 100));
    }

    // 3. Tester les requêtes multiples rapides (comme dans l'interface)
    console.log('\n3️⃣ Testing rapid multiple requests...');
    
    const rapidPromises = [];
    for (let i = 0; i < 5; i++) {
      rapidPromises.push(fetch(`${baseUrl}/api/articles/1000`, { headers }));
    }

    const rapidResponses = await Promise.all(rapidPromises);
    
    for (let i = 0; i < rapidResponses.length; i++) {
      const text = await rapidResponses[i].text();
      try {
        JSON.parse(text);
        console.log(`   Request ${i + 1}: ✅ Valid JSON`);
      } catch (e) {
        console.log(`   Request ${i + 1}: ❌ Invalid JSON - ${e.message}`);
        console.log(`   Content: ${text.substring(0, 50)}`);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

simulateEditPageRequests();