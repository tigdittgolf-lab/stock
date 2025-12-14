// Tester l'endpoint de debug
async function testDebugEndpoint() {
  console.log('🔍 Testing DEBUG endpoint...');
  
  try {
    const response = await fetch('http://localhost:3005/api/sales/debug/delivery-notes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ DEBUG endpoint successful!');
      console.log('🔍 Debug info:');
      console.log(`   - Tenant: ${result.tenant}`);
      console.log(`   - Next Number: ${result.nextNumber}`);
      console.log(`   - Clients Count: ${result.clientsCount}`);
      console.log(`   - BL Count: ${result.blCount}`);
      console.log(`   - Message: ${result.message}`);
      
      if (result.data && result.data.length > 0) {
        console.log('\n📋 BL Data Structure:');
        result.data.forEach((bl, index) => {
          console.log(`\nBL ${index + 1}:`);
          console.log(`  - nfact: ${bl.nfact}`);
          console.log(`  - nclient: ${bl.nclient}`);
          console.log(`  - client_name: ${bl.client_name}`);
          console.log(`  - date_fact: ${bl.date_fact}`);
          console.log(`  - montant_ht: ${bl.montant_ht}`);
          console.log(`  - tva: ${bl.tva}`);
          console.log(`  - type: ${bl.type}`);
        });
      }
    } else {
      console.error('❌ DEBUG endpoint failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error testing debug endpoint:', error);
  }
}

testDebugEndpoint();