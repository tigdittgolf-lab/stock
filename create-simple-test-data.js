// Créer des données de test simples pour BU02
async function createSimpleTestData() {
  try {
    console.log('📝 Création de données de test simples pour BU02...');
    
    // Tester d'abord l'accès au tenant BU02
    console.log('🔍 Test d\'accès au tenant BU02...');
    
    const testResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu02',
        'Content-Type': 'application/json'
      }
    });
    
    const testData = await testResponse.json();
    console.log('📊 Données actuelles BU02:', JSON.stringify(testData, null, 2));
    
    // Tester l'accès aux clients
    console.log('\n👥 Test d\'accès aux clients BU02...');
    
    const clientsResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/clients', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu02',
        'Content-Type': 'application/json'
      }
    });
    
    const clientsData = await clientsResponse.json();
    console.log('👤 Clients BU02:', JSON.stringify(clientsData, null, 2));
    
    // Tester l'accès aux fournisseurs
    console.log('\n🏭 Test d\'accès aux fournisseurs BU02...');
    
    const suppliersResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/suppliers', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu02',
        'Content-Type': 'application/json'
      }
    });
    
    const suppliersData = await suppliersResponse.json();
    console.log('🏭 Fournisseurs BU02:', JSON.stringify(suppliersData, null, 2));
    
    // Tester l'accès aux articles
    console.log('\n📦 Test d\'accès aux articles BU02...');
    
    const articlesResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/articles', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu02',
        'Content-Type': 'application/json'
      }
    });
    
    const articlesData = await articlesResponse.json();
    console.log('📦 Articles BU02:', JSON.stringify(articlesData, null, 2));
    
    console.log('\n✅ Test terminé!');
    console.log('📌 Instructions pour votre ami:');
    console.log('1. Aller sur: https://frontend-iota-six-72.vercel.app/');
    console.log('2. Se connecter avec n\'importe quel compte');
    console.log('3. Sélectionner: "Business Unit 02 (2025) - 2025_bu02"');
    console.log('4. Il verra un environnement séparé avec ses propres données');
    console.log('5. Vous utilisez BU01 (2025_bu01), lui utilise BU02 (2025_bu02)');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createSimpleTestData();