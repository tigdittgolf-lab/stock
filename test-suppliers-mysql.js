// Test script pour vérifier que les fournisseurs viennent de MySQL
async function testSuppliersMySQL() {
  try {
    console.log('🧪 Test fournisseurs depuis MySQL...');
    
    // 1. S'assurer que le backend est sur MySQL
    const switchResponse = await fetch('http://localhost:3005/api/database/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'mysql',
        config: {
          name: 'MySQL Local',
          host: 'localhost',
          port: 3306,
          database: '2025_bu01',
          username: 'root',
          password: ''
        }
      })
    });
    
    const switchData = await switchResponse.json();
    console.log('🔄 Backend switch:', switchData.success ? 'OK' : 'FAILED');
    
    // 2. Tester les fournisseurs
    const suppliersResponse = await fetch('http://localhost:3005/api/suppliers', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const suppliersData = await suppliersResponse.json();
    
    console.log('🏭 Fournisseurs depuis MySQL:');
    console.log('  - Nombre:', suppliersData.data?.length || 0);
    console.log('  - Database type:', suppliersData.database_type);
    console.log('  - Source:', suppliersData.source);
    
    if (suppliersData.data && suppliersData.data.length > 0) {
      console.log('  - Premier fournisseur:', suppliersData.data[0].nfournisseur, '-', suppliersData.data[0].nom_fournisseur);
    }
    
    // 3. Tester les clients
    const clientsResponse = await fetch('http://localhost:3005/api/clients', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const clientsData = await clientsResponse.json();
    
    console.log('👥 Clients depuis MySQL:');
    console.log('  - Nombre:', clientsData.data?.length || 0);
    console.log('  - Database type:', clientsData.database_type);
    console.log('  - Source:', clientsData.source);
    
    if (clientsData.data && clientsData.data.length > 0) {
      console.log('  - Premier client:', clientsData.data[0].nclient, '-', clientsData.data[0].nom_client);
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error);
  }
}

testSuppliersMySQL();