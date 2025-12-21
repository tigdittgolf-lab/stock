// Test pour vérifier que l'impression fonctionne avec les headers
const testPrintWithHeaders = async () => {
  console.log('🧪 Testing Print with Tenant Headers');
  console.log('====================================');
  
  const baseURL = 'http://localhost:3005/api/pdf';
  const tenant = '2025_bu01';
  
  const tests = [
    { name: 'BL Complet', url: `${baseURL}/delivery-note/5` },
    { name: 'BL Réduit', url: `${baseURL}/delivery-note-small/5` },
    { name: 'BL Ticket', url: `${baseURL}/delivery-note-ticket/5` },
    { name: 'Facture', url: `${baseURL}/invoice/1` },
    { name: 'Proforma', url: `${baseURL}/proforma/1` }
  ];
  
  console.log('1️⃣ Testing WITHOUT headers (should fail)...');
  
  try {
    const response = await fetch(`${baseURL}/delivery-note/5`);
    const data = await response.json();
    
    if (data.success === false && data.error === 'Tenant header required') {
      console.log('✅ Correctly requires tenant header');
    } else {
      console.log('❌ Should require tenant header but doesn\'t');
    }
  } catch (error) {
    console.log('❌ Unexpected error:', error.message);
  }
  
  console.log('\n2️⃣ Testing WITH headers (should work)...');
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const size = response.headers.get('content-length');
        
        if (contentType && contentType.includes('application/pdf')) {
          console.log(`✅ ${test.name}: PDF ${size} bytes`);
        } else {
          console.log(`❌ ${test.name}: Not a PDF response`);
        }
      } else {
        const errorData = await response.json();
        console.log(`❌ ${test.name}: ${errorData.error}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n3️⃣ Simulating Frontend Print Flow...');
  
  // Simuler le flux frontend
  const simulateFrontendPrint = async (url, docName) => {
    try {
      const response = await fetch(url, {
        headers: {
          'X-Tenant': tenant
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        console.log(`✅ ${docName}: Blob created (${blob.size} bytes)`);
        
        // Simuler la création d'URL
        const pdfUrl = URL.createObjectURL(blob);
        console.log(`✅ ${docName}: PDF URL created`);
        
        // Nettoyer
        URL.revokeObjectURL(pdfUrl);
        console.log(`✅ ${docName}: URL cleaned up`);
        
        return true;
      } else {
        const errorData = await response.json();
        console.log(`❌ ${docName}: ${errorData.error}`);
        return false;
      }
    } catch (error) {
      console.log(`❌ ${docName}: ${error.message}`);
      return false;
    }
  };
  
  const results = await Promise.all([
    simulateFrontendPrint(`${baseURL}/delivery-note/5`, 'BL Complet'),
    simulateFrontendPrint(`${baseURL}/invoice/1`, 'Facture'),
    simulateFrontendPrint(`${baseURL}/proforma/1`, 'Proforma')
  ]);
  
  const successCount = results.filter(r => r).length;
  
  console.log('\n📊 RESULTS:');
  console.log(`✅ Successful prints: ${successCount}/${results.length}`);
  
  if (successCount === results.length) {
    console.log('🎉 ALL PRINT FUNCTIONS WORKING WITH HEADERS!');
    console.log('✅ Frontend PrintOptions component should work now');
  } else {
    console.log('⚠️  Some print functions still have issues');
  }
};

testPrintWithHeaders().catch(console.error);