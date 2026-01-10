// Test script to verify invoice details fix
const fetch = require('node-fetch');

async function testInvoiceDetails() {
  try {
    console.log('🧪 Testing Invoice Details Fix...');
    
    // Test the backend endpoint directly
    const backendUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices/2';
    
    console.log(`📞 Calling backend: ${backendUrl}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('✅ Backend Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log(`📋 Invoice ID: ${result.data.nfact}`);
      console.log(`👤 Client: ${result.data.client_name}`);
      console.log(`💰 Total: ${result.data.montant_ttc} DA`);
      console.log(`📦 Details count: ${result.data.details?.length || 0}`);
      
      if (result.data.details && result.data.details.length > 0) {
        console.log('📦 Article Details:');
        result.data.details.forEach((detail, index) => {
          console.log(`  ${index + 1}. ${detail.designation} (${detail.narticle}) - Qty: ${detail.qte}, Price: ${detail.prix} DA`);
        });
        console.log('🎉 SUCCESS: Invoice details are now working!');
      } else {
        console.log('⚠️ WARNING: No article details found - still showing "Aucun détail d\'article disponible"');
      }
    } else {
      console.log('❌ ERROR: Backend returned error:', result.error);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testInvoiceDetails();