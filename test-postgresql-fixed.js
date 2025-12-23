// Test PostgreSQL après correction
async function testPostgreSQLFixed() {
  const baseUrl = 'http://localhost:3005/api';
  
  console.log('🐘 TEST POSTGRESQL APRÈS CORRECTION\n');
  
  try {
    // 1. Switch vers PostgreSQL
    console.log('1️⃣ SWITCH VERS POSTGRESQL...');
    const switchResponse = await fetch(`${baseUrl}/database-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'postgresql',
        name: 'PostgreSQL Local',
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres'
      })
    });
    
    const switchData = await switchResponse.json();
    console.log('Switch result:', switchData.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (!switchData.success) {
      console.log('❌ Switch échoué:', switchData.error);
      return;
    }
    
    // 2. Test suppliers
    console.log('\n2️⃣ TEST SUPPLIERS...');
    const suppliersResponse = await fetch(`${baseUrl}/sales/suppliers`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const suppliersData = await suppliersResponse.json();
    
    console.log('Suppliers result:', suppliersData.success ? '✅ SUCCESS' : '❌ FAILED');
    if (suppliersData.success) {
      console.log(`   Données: ${suppliersData.data?.length || 0} fournisseurs`);
      console.log(`   Database type: ${suppliersData.database_type}`);
    } else {
      console.log('   Erreur:', suppliersData.error);
    }
    
    // 3. Test articles
    console.log('\n3️⃣ TEST ARTICLES...');
    const articlesResponse = await fetch(`${baseUrl}/sales/articles`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const articlesData = await articlesResponse.json();
    
    console.log('Articles result:', articlesData.success ? '✅ SUCCESS' : '❌ FAILED');
    if (articlesData.success) {
      console.log(`   Données: ${articlesData.data?.length || 0} articles`);
      console.log(`   Database type: ${articlesData.database_type}`);
    } else {
      console.log('   Erreur:', articlesData.error);
    }
    
    // 4. Test clients
    console.log('\n4️⃣ TEST CLIENTS...');
    const clientsResponse = await fetch(`${baseUrl}/sales/clients`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const clientsData = await clientsResponse.json();
    
    console.log('Clients result:', clientsData.success ? '✅ SUCCESS' : '❌ FAILED');
    if (clientsData.success) {
      console.log(`   Données: ${clientsData.data?.length || 0} clients`);
      console.log(`   Database type: ${clientsData.database_type}`);
    } else {
      console.log('   Erreur:', clientsData.error);
    }
    
    console.log('\n📊 RÉSUMÉ:');
    console.log(`✅ PostgreSQL switch: ${switchData.success ? 'OK' : 'FAILED'}`);
    console.log(`✅ Suppliers: ${suppliersData.success ? 'OK' : 'FAILED'}`);
    console.log(`✅ Articles: ${articlesData.success ? 'OK' : 'FAILED'}`);
    console.log(`✅ Clients: ${clientsData.success ? 'OK' : 'FAILED'}`);
    
  } catch (error) {
    console.error('❌ Test échoué:', error);
  }
}

testPostgreSQLFixed();