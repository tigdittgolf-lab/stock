// Test pour vérifier que seules les vraies données sont retournées
async function testRealBLData() {
  console.log('🧪 Testing real BL data (no mock data)...');
  
  try {
    const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('✅ BL response received:');
      console.log('📋 Success:', data.success);
      console.log('📋 Data length:', data.data?.length || 0);
      console.log('📋 Source:', data.source);
      console.log('📋 Database type:', data.database_type);
      
      if (data.data && data.data.length > 0) {
        console.log('📋 BL data found (real data):');
        console.log(JSON.stringify(data.data[0], null, 2));
      } else {
        console.log('📋 No BL data found - this is correct if no real data exists');
      }
    } else {
      console.error('❌ Request failed:', response.status, response.statusText);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testRealBLData();