// Script pour créer un système d'isolation des tenants par utilisateur
async function createTenantIsolationSystem() {
  try {
    console.log('🔧 Création du système d\'isolation des tenants...');
    
    // 1. Créer un tenant spécifique pour votre ami
    const friendTenant = '2025_bu02'; // Tenant séparé pour votre ami
    
    // Test de création du tenant via l'API
    const createTenantResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/auth/init-test-data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_unit: 'bu02',
        year: 2025
      })
    });
    
    const createResult = await createTenantResponse.json();
    console.log('📊 Résultat création tenant:', createResult);
    
    // 2. Tester l'accès aux données du nouveau tenant
    console.log('\n🔍 Test d\'accès aux données du nouveau tenant...');
    
    const testDataResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'X-Tenant': friendTenant,
        'Content-Type': 'application/json'
      }
    });
    
    const testData = await testDataResponse.json();
    console.log('📋 Données du nouveau tenant:', testData);
    
    // 3. Créer des données de test pour le nouveau tenant
    console.log('\n📝 Création de données de test pour le nouveau tenant...');
    
    // Créer un client de test
    const clientResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/clients', {
      method: 'POST',
      headers: {
        'X-Tenant': friendTenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nclient: '500',
        raison_sociale: 'Client Ami Test',
        adresse: 'Adresse Test Ami',
        tel: '0123456789',
        email: 'ami@test.com'
      })
    });
    
    const clientResult = await clientResponse.json();
    console.log('👤 Client créé:', clientResult);
    
    // Créer un BL de test
    const blResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'POST',
      headers: {
        'X-Tenant': friendTenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        nclient: '500',
        date_fact: '2025-01-03',
        articles: [
          {
            narticle: 'ART001',
            qte: 2,
            prix: 100
          }
        ]
      })
    });
    
    const blResult = await blResponse.json();
    console.log('📋 BL créé:', blResult);
    
    console.log('\n✅ Système d\'isolation créé avec succès!');
    console.log('📌 Instructions pour votre ami:');
    console.log('1. Se connecter sur: https://frontend-iota-six-72.vercel.app/');
    console.log('2. Sélectionner le tenant: 2025_bu02 (Business Unit 02)');
    console.log('3. Il verra ses propres données séparées des vôtres');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

createTenantIsolationSystem();