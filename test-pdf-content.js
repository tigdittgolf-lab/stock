// Test PDF content by downloading and checking size
async function testPDFContent() {
  try {
    console.log('🔍 Testing PDF content...');
    
    const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/delivery-note/5', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    if (response.status === 200) {
      const pdfBuffer = await response.arrayBuffer();
      const pdfSize = pdfBuffer.byteLength;
      
      console.log('✅ PDF generated successfully!');
      console.log('📄 PDF Size:', pdfSize, 'bytes');
      console.log('📄 Content-Type:', response.headers.get('content-type'));
      console.log('📄 Content-Disposition:', response.headers.get('content-disposition'));
      
      // A valid PDF should be at least a few KB
      if (pdfSize > 1000) {
        console.log('✅ PDF appears to have valid content (size > 1KB)');
      } else {
        console.log('⚠️ PDF might be empty or corrupted (size < 1KB)');
      }
      
      // Test other BL IDs
      console.log('\n🔍 Testing other BL IDs...');
      for (const blId of [4, 3]) {
        const testResponse = await fetch(`https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/delivery-note/${blId}`, {
          method: 'GET',
          headers: {
            'X-Tenant': '2025_bu01',
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`📋 BL ${blId}: Status ${testResponse.status}, Size: ${testResponse.headers.get('content-length')} bytes`);
      }
      
    } else {
      const text = await response.text();
      console.log('❌ Error response:', text);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testPDFContent();