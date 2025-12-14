// Tester l'endpoint GET /api/sales/delivery-notes
async function testGetDeliveryNotes() {
  console.log('🧪 Testing GET /api/sales/delivery-notes endpoint...');
  
  try {
    const response = await fetch('http://localhost:3005/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ GET delivery-notes successful!');
      console.log(`📋 Found ${result.data?.length || 0} delivery notes`);
      
      if (result.data && result.data.length > 0) {
        console.log('📄 Sample delivery note:');
        console.log(JSON.stringify(result.data[0], null, 2));
      }
    } else {
      console.error('❌ GET delivery-notes failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  }
}

testGetDeliveryNotes();