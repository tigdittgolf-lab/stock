// Test complet des 3 bases de données
async function testAllThreeDatabases() {
  const baseUrl = 'http://localhost:3005/api';
  
  console.log('🔄 TEST COMPLET DES 3 BASES DE DONNÉES\n');
  
  const databases = [
    {
      name: 'MySQL',
      config: {
        type: 'mysql',
        name: 'MySQL Local',
        host: 'localhost',
        port: 3306,
        database: 'stock_local',
        username: 'root',
        password: ''
      }
    },
    {
      name: 'PostgreSQL',
      config: {
        type: 'postgresql',
        name: 'PostgreSQL Local',
        host: 'localhost',
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres'
      }
    },
    {
      name: 'Supabase',
      config: {
        type: 'supabase',
        name: 'Supabase Production'
      }
    }
  ];
  
  const results = {};
  
  for (const db of databases) {
    try {
      console.log(`🔄 SWITCH VERS ${db.name.toUpperCase()}...`);
      
      // Switch vers la base de données
      const switchResponse = await fetch(`${baseUrl}/database-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(db.config)
      });
      
      const switchData = await switchResponse.json();
      
      if (switchData.success) {
        // Test des données
        const suppliersResponse = await fetch(`${baseUrl}/sales/suppliers`, {
          headers: { 'X-Tenant': '2025_bu01' }
        });
        const suppliersData = await suppliersResponse.json();
        
        const articlesResponse = await fetch(`${baseUrl}/sales/articles`, {
          headers: { 'X-Tenant': '2025_bu01' }
        });
        const articlesData = await articlesResponse.json();
        
        const clientsResponse = await fetch(`${baseUrl}/sales/clients`, {
          headers: { 'X-Tenant': '2025_bu01' }
        });
        const clientsData = await clientsResponse.json();
        
        results[db.name] = {
          success: true,
          suppliers: suppliersData.data?.length || 0,
          articles: articlesData.data?.length || 0,
          clients: clientsData.data?.length || 0,
          dbType: suppliersData.database_type
        };
        
        console.log(`✅ ${db.name}: ${results[db.name].suppliers} fournisseurs, ${results[db.name].articles} articles, ${results[db.name].clients} clients`);
      } else {
        results[db.name] = { success: false, error: switchData.error };
        console.log(`❌ ${db.name}: Switch échoué - ${switchData.error}`);
      }
      
    } catch (error) {
      results[db.name] = { success: false, error: error.message };
      console.log(`❌ ${db.name}: Erreur - ${error.message}`);
    }
    
    console.log('');
  }
  
  // Résumé final
  console.log('📊 RÉSUMÉ FINAL:');
  console.log('================');
  
  Object.entries(results).forEach(([dbName, result]) => {
    if (result.success) {
      console.log(`${dbName.padEnd(12)}: ✅ ${result.suppliers}F / ${result.articles}A / ${result.clients}C (${result.dbType})`);
    } else {
      console.log(`${dbName.padEnd(12)}: ❌ ${result.error}`);
    }
  });
  
  // Vérifier si les données sont différentes
  const uniqueData = new Set();
  Object.values(results).forEach(result => {
    if (result.success) {
      uniqueData.add(`${result.suppliers}-${result.articles}-${result.clients}`);
    }
  });
  
  console.log(`\n🎯 Données uniques: ${uniqueData.size > 1 ? '✅ OUI' : '❌ NON'} (${uniqueData.size} variations)`);
  console.log(`🔄 Switch transparent: ${Object.values(results).every(r => r.success) ? '✅ OUI' : '❌ NON'}`);
}

testAllThreeDatabases();