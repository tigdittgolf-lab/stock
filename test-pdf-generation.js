// Test PDF generation directly
async function testPDFGeneration() {
  try {
    console.log('🔍 Testing PDF generation for BL 5...');
    
    const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/delivery-note/5', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ PDF generated successfully!');
      console.log('📄 Content-Type:', response.headers.get('content-type'));
      console.log('📄 Content-Length:', response.headers.get('content-length'));
    } else {
      const text = await response.text();
      console.log('❌ Error response:', text);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPDFGeneration();