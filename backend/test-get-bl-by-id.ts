// Tester l'endpoint GET /api/sales/delivery-notes/:id
async function testGetBLById() {
  console.log('🧪 Testing GET /api/sales/delivery-notes/2 endpoint...');
  
  try {
    const response = await fetch('http://localhost:3005/api/sales/delivery-notes/2', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ GET delivery-notes/2 successful!');
      console.log('📄 BL details:');
      console.log(JSON.stringify(result.data, null, 2));
    } else {
      console.error('❌ GET delivery-notes/2 failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  }
}

testGetBLById();