// Test script to switch to Supabase and verify data
async function testSupabaseSwitch() {
  const baseUrl = 'http://localhost:3005/api';
  
  try {
    // 1. Switch to Supabase
    console.log('🔄 Switching to Supabase...');
    const switchResponse = await fetch(`${baseUrl}/database-config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'supabase',
        name: 'Supabase Production'
        // Les variables d'environnement seront utilisées automatiquement
      })
    });
    const switchData = await switchResponse.json();
    console.log('Switch result:', switchData);
    
    // 2. Check current database status
    console.log('\n🔍 Checking current database status...');
    const statusResponse = await fetch(`${baseUrl}/database-config`);
    const statusData = await statusResponse.json();
    console.log('Current database:', statusData);
    
    // 3. Test suppliers endpoint with Supabase
    console.log('\n📊 Testing suppliers endpoint with Supabase...');
    const suppliersResponse = await fetch(`${baseUrl}/sales/suppliers`, {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const suppliersData = await suppliersResponse.json();
    console.log('Suppliers data:', suppliersData);
    
    if (suppliersData.success && suppliersData.data) {
      console.log(`✅ Found ${suppliersData.data.length} suppliers from Supabase`);
      suppliersData.data.forEach((supplier, index) => {
        console.log(`  ${index + 1}. ${supplier.nfournisseur} - ${supplier.nom_fournisseur}`);
      });
    } else {
      console.log('❌ No suppliers data or error:', suppliersData.error);
    }
    
    // 4. Test direct Supabase connection
    console.log('\n🔗 Testing direct Supabase RPC call...');
    try {
      const directResponse = await fetch(`${baseUrl}/sales/suppliers?direct=true`, {
        headers: { 'X-Tenant': '2025_bu01' }
      });
      const directData = await directResponse.json();
      console.log('Direct Supabase data:', directData);
    } catch (error) {
      console.log('Direct Supabase test failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSupabaseSwitch();