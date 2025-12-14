// Tester tous les bons de livraison retournés
async function testAllDeliveryNotes() {
  console.log('🧪 Testing ALL delivery notes returned...');
  
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
      console.log(`📋 Total found: ${result.data?.length || 0} delivery notes`);
      
      if (result.data && result.data.length > 0) {
        console.log('📄 ALL delivery notes:');
        result.data.forEach((bl, index) => {
          console.log(`\n--- BL ${index + 1} ---`);
          console.log(`ID: ${bl.id || bl.nbl}`);
          console.log(`Client: ${bl.nclient} - ${bl.client_name}`);
          console.log(`Date: ${bl.date_fact}`);
          console.log(`Montant HT: ${bl.montant_ht}`);
          console.log(`TVA: ${bl.tva}`);
          console.log(`Montant TTC: ${bl.montant_ttc}`);
        });
      }
    } else {
      console.error('❌ GET delivery-notes failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error testing endpoint:', error);
  }
}

testAllDeliveryNotes();