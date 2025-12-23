// Test script to switch database and verify suppliers data
async function testDatabaseSwitch() {
  const baseUrl = 'http://localhost:3005/api';
  
  try {
    // 1. Check current database status
    console.log('🔍 Checking current database status...');
    const statusResponse = await fetch(`${baseUrl}/database-config`);
    const statusData = await statusResponse.json();
    console.log('Current database:', statusData);
    
    // 2. Switch to MySQL
    console.log('\n🔄 Switching to MySQL...');
    const switchResponse = await fetch(`${baseUrl}/database-config`, {
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
    const switchData = await switchResponse.json();
    console.log('Switch result:', switchData);
    
    // 3. Test suppliers endpoint
    console.log('\n📊 Testing suppliers endpoint...');
    const suppliersResponse = await fetch(`${baseUrl}/sales/suppliers`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const suppliersData = await suppliersResponse.json();
    console.log('Suppliers data:', suppliersData);
    
    if (suppliersData.success && suppliersData.data) {
      console.log(`✅ Found ${suppliersData.data.length} suppliers from MySQL`);
      suppliersData.data.forEach((supplier, index) => {
        console.log(`  ${index + 1}. ${supplier.nfournisseur} - ${supplier.nom_fournisseur}`);
      });
    } else {
      console.log('❌ No suppliers data or error:', suppliersData.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDatabaseSwitch();