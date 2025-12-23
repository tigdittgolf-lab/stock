// Test complet du switch entre MySQL et Supabase
async function testCompleteSwitch() {
  const baseUrl = 'http://localhost:3005/api';
  
  console.log('🔄 TEST COMPLET DU SWITCH DE BASE DE DONNÉES\n');
  
  try {
    // 1. Switch vers MySQL
    console.log('1️⃣ SWITCH VERS MYSQL...');
    const mysqlResponse = await fetch(`${baseUrl}/database-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mysql',
        name: 'MySQL Local',
        host: 'localhost',
        port: 3306,
        database: 'stock_local',
        username: 'root',
        password: ''
      })
    });
    const mysqlData = await mysqlResponse.json();
    console.log('MySQL Switch:', mysqlData.success ? '✅ SUCCESS' : '❌ FAILED');
    
    // Test données MySQL
    const mysqlSuppliersResponse = await fetch(`${baseUrl}/sales/suppliers`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const mysqlSuppliersData = await mysqlSuppliersResponse.json();
    console.log(`MySQL Data: ${mysqlSuppliersData.data?.length || 0} fournisseurs (${mysqlSuppliersData.database_type})\n`);
    
    // 2. Switch vers Supabase
    console.log('2️⃣ SWITCH VERS SUPABASE...');
    const supabaseResponse = await fetch(`${baseUrl}/database-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'supabase',
        name: 'Supabase Production'
      })
    });
    const supabaseData = await supabaseResponse.json();
    console.log('Supabase Switch:', supabaseData.success ? '✅ SUCCESS' : '❌ FAILED');
    
    // Test données Supabase
    const supabaseSuppliersResponse = await fetch(`${baseUrl}/sales/suppliers`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const supabaseSuppliersData = await supabaseSuppliersResponse.json();
    console.log(`Supabase Data: ${supabaseSuppliersData.data?.length || 0} fournisseurs (${supabaseSuppliersData.database_type})\n`);
    
    // 3. Retour vers MySQL
    console.log('3️⃣ RETOUR VERS MYSQL...');
    const backToMysqlResponse = await fetch(`${baseUrl}/database-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mysql',
        name: 'MySQL Local',
        host: 'localhost',
        port: 3306,
        database: 'stock_local',
        username: 'root',
        password: ''
      })
    });
    const backToMysqlData = await backToMysqlResponse.json();
    console.log('Retour MySQL:', backToMysqlData.success ? '✅ SUCCESS' : '❌ FAILED');
    
    // Test données MySQL à nouveau
    const finalMysqlResponse = await fetch(`${baseUrl}/sales/suppliers`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const finalMysqlData = await finalMysqlResponse.json();
    console.log(`MySQL Final: ${finalMysqlData.data?.length || 0} fournisseurs (${finalMysqlData.database_type})\n`);
    
    // 4. Résumé
    console.log('📊 RÉSUMÉ DU TEST:');
    console.log(`MySQL: ${mysqlSuppliersData.data?.length || 0} fournisseurs`);
    console.log(`Supabase: ${supabaseSuppliersData.data?.length || 0} fournisseurs`);
    console.log(`Switch transparent: ${mysqlSuppliersData.data?.length !== supabaseSuppliersData.data?.length ? '✅ OUI' : '❌ NON'}`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCompleteSwitch();