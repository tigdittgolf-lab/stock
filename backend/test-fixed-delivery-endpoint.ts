// Tester l'endpoint corrigé des bons de livraison
async function testFixedDeliveryEndpoint() {
  console.log('🧪 Testing fixed delivery note endpoint...');
  
  const testData = {
    Nclient: 'CL01',
    date_fact: '2025-01-01',
    detail_bl: [
      {
        Narticle: '1000',
        Qte: 1,
        prix: 100,
        tva: 19
      }
    ]
  };
  
  try {
    const response = await fetch('http://localhost:3005/api/sales/delivery-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify(testData)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ Delivery note creation SUCCESS!');
      console.log('📋 Result:', JSON.stringify(result, null, 2));
    } else {
      console.log('❌ Delivery note creation FAILED:');
      console.log('📋 Error:', result.error);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Attendre que le serveur soit prêt
setTimeout(() => {
  testFixedDeliveryEndpoint();
}, 2000);