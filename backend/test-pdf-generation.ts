// Tester la génération PDF des bons de livraison
async function testPDFGeneration() {
  console.log('🧪 Testing PDF generation for delivery note...');
  
  try {
    const response = await fetch('http://localhost:3005/api/pdf/delivery-note/2', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (response.ok) {
      console.log('✅ PDF generation successful!');
      console.log('📄 Content-Type:', response.headers.get('content-type'));
      console.log('📄 Content-Length:', response.headers.get('content-length'));
    } else {
      const errorText = await response.text();
      console.error('❌ PDF generation failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF generation:', error);
  }
}

testPDFGeneration();