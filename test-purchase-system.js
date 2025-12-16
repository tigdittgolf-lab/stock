// Test script to verify purchase system is working
const testPurchaseSystem = async () => {
  try {
    console.log('🧪 Testing Purchase System...');
    
    // Test 1: Check if backend is responding
    const healthResponse = await fetch('http://localhost:3005/health');
    if (healthResponse.ok) {
      console.log('✅ Backend is responding');
    } else {
      console.log('❌ Backend health check failed');
      return;
    }
    
    // Test 2: Try to fetch purchase invoices list
    const listResponse = await fetch('http://localhost:3005/api/purchases/invoices', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const listData = await listResponse.json();
    console.log('📋 Purchase invoices list:', listData);
    
    // Test 3: Try to create a purchase invoice
    const createResponse = await fetch('http://localhost:3005/api/purchases/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        Nfournisseur: 'FOURNISSEUR 1',
        numero_facture_fournisseur: 'TEST-FAC-2025-001',
        date_fact: '2025-12-16',
        detail_fact_achat: [
          {
            Narticle: '1000',
            Qte: 5,
            prix: 100.00,
            tva: 19
          }
        ]
      })
    });
    
    const createData = await createResponse.json();
    console.log('🆕 Purchase invoice creation:', createData);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testPurchaseSystem();