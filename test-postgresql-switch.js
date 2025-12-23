// Test script pour vérifier le switch vers PostgreSQL
async function testPostgreSQLSwitch() {
  try {
    console.log('🧪 Test changement vers PostgreSQL...');
    
    // 1. Forcer le changement vers PostgreSQL
    const switchResponse = await fetch('http://localhost:3005/api/database/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'postgresql',
        config: {
          name: 'PostgreSQL Local',
          host: 'localhost',
          port: 5432,
          database: 'postgres',
          username: 'postgres',
          password: 'postgres'
        }
      })
    });
    
    const switchData = await switchResponse.json();
    console.log('🔄 PostgreSQL switch:', switchData.success ? 'OK' : 'FAILED');
    console.log('   Message:', switchData.message);
    
    // 2. Vérifier l'état actuel
    const currentResponse = await fetch('http://localhost:3005/api/database/current');
    const currentData = await currentResponse.json();
    console.log('📊 État actuel:', currentData.currentType);
    
    // 3. Tester les articles
    const articlesResponse = await fetch('http://localhost:3005/api/articles', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const articlesData = await articlesResponse.json();
    
    console.log('📦 Articles depuis PostgreSQL:');
    console.log('  - Nombre:', articlesData.data?.length || 0);
    console.log('  - Database type:', articlesData.database_type);
    console.log('  - Success:', articlesData.success);
    
    if (articlesData.data && articlesData.data.length > 0) {
      console.log('  - Premier article:', articlesData.data[0].narticle, '-', articlesData.data[0].designation);
    }
    
    // 4. Tester les fournisseurs
    const suppliersResponse = await fetch('http://localhost:3005/api/suppliers', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const suppliersData = await suppliersResponse.json();
    
    console.log('🏭 Fournisseurs depuis PostgreSQL:');
    console.log('  - Nombre:', suppliersData.data?.length || 0);
    console.log('  - Database type:', suppliersData.database_type);
    console.log('  - Success:', suppliersData.success);
    
    // 5. Tester les clients
    const clientsResponse = await fetch('http://localhost:3005/api/clients', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const clientsData = await clientsResponse.json();
    
    console.log('👥 Clients depuis PostgreSQL:');
    console.log('  - Nombre:', clientsData.data?.length || 0);
    console.log('  - Database type:', clientsData.database_type);
    console.log('  - Success:', clientsData.success);
    
  } catch (error) {
    console.error('❌ Erreur test PostgreSQL:', error);
  }
}

testPostgreSQLSwitch();