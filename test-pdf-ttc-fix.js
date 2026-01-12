// Test script to verify PDF TTC calculation fix
const fetch = require('node-fetch');

async function testPDFTTCCalculation() {
  console.log('🧪 Testing PDF TTC calculation fix...');
  
  const baseUrl = 'https://frontend-iota-six-72.vercel.app';
  const tenant = '2025_bu01';
  
  // Test BL PDF generation with different database types
  const testCases = [
    { id: 5, name: 'BL 5' }
  ];
  
  for (const testCase of testCases) {
    console.log(`\n📋 Testing ${testCase.name}...`);
    
    try {
      // Test PDF generation
      const pdfResponse = await fetch(`${baseUrl}/api/pdf/delivery-note/${testCase.id}`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      console.log(`📄 PDF Response Status: ${pdfResponse.status}`);
      console.log(`📄 PDF Content-Type: ${pdfResponse.headers.get('content-type')}`);
      console.log(`📄 PDF Content-Length: ${pdfResponse.headers.get('content-length')} bytes`);
      
      if (pdfResponse.status === 200) {
        console.log(`✅ ${testCase.name} PDF generated successfully`);
      } else {
        const errorText = await pdfResponse.text();
        console.log(`❌ ${testCase.name} PDF generation failed:`, errorText);
      }
      
      // Also test the data endpoint to see the raw data
      const dataResponse = await fetch(`${baseUrl}/api/sales/delivery-notes/${testCase.id}`, {
        headers: {
          'X-Tenant': tenant
        }
      });
      
      if (dataResponse.status === 200) {
        const data = await dataResponse.json();
        console.log(`📊 ${testCase.name} Data:`, {
          montant_ht: data.data.montant_ht,
          tva: data.data.tva,
          montant_ttc: data.data.montant_ttc,
          database_type: data.database_type,
          types: {
            montant_ht: typeof data.data.montant_ht,
            tva: typeof data.data.tva,
            montant_ttc: typeof data.data.montant_ttc
          }
        });
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${testCase.name}:`, error.message);
    }
  }
}

testPDFTTCCalculation();