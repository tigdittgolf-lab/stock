// Test génération PDF BL
async function testPDFGeneration() {
  console.log('🧪 Testing PDF generation...');
  
  const BACKEND_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  const TENANT = '2025_bu01';
  
  try {
    // Test génération PDF pour BL 5
    console.log('\n📄 Testing PDF generation for BL 5...');
    const response = await fetch(`${BACKEND_URL}/api/pdf/delivery-note/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': TENANT,
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 PDF Response status: ${response.status}`);
    console.log(`📊 PDF Response headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        console.log('✅ PDF generated successfully!');
        console.log(`📄 PDF size: ${response.headers.get('content-length') || 'unknown'} bytes`);
      } else {
        const text = await response.text();
        console.log('⚠️ Response is not PDF:', text.substring(0, 200));
      }
    } else {
      const errorText = await response.text();
      console.log(`❌ PDF generation failed: ${response.status}`);
      console.log('Error details:', errorText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testPDFGeneration();