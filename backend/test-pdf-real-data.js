// Test script pour vérifier que l'impression utilise les vraies données
const testPDFEndpoints = async () => {
  const baseURL = 'http://localhost:3005';
  const tenant = '2025_bu01';
  
  console.log('🧪 Testing PDF endpoints with REAL data...');
  
  const endpoints = [
    { name: 'BL Complet', url: `/api/pdf/delivery-note/5`, description: 'Bon de livraison format complet' },
    { name: 'BL Réduit', url: `/api/pdf/delivery-note-small/5`, description: 'Bon de livraison format réduit' },
    { name: 'Ticket', url: `/api/pdf/delivery-note-ticket/5`, description: 'Ticket de caisse' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n📋 Testing ${endpoint.name}...`);
      
      const response = await fetch(`${baseURL}${endpoint.url}`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/pdf')) {
          console.log(`✅ ${endpoint.name}: PDF generated successfully`);
          console.log(`   📄 Content-Type: ${contentType}`);
          console.log(`   📊 Size: ${response.headers.get('content-length') || 'Unknown'} bytes`);
        } else {
          console.log(`❌ ${endpoint.name}: Not a PDF response`);
          const text = await response.text();
          console.log(`   Response: ${text.substring(0, 200)}...`);
        }
      } else {
        console.log(`❌ ${endpoint.name}: HTTP ${response.status}`);
        const text = await response.text();
        console.log(`   Error: ${text.substring(0, 200)}...`);
      }
      
    } catch (error) {
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Expected result: All PDFs should show BL 5 with client "415 Kaddour" and real data');
};

// Run the test
testPDFEndpoints().catch(console.error);