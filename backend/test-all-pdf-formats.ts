// Tester tous les formats PDF
async function testAllPDFFormats() {
  console.log('🧪 Testing ALL PDF formats with real data...');
  
  const formats = [
    { name: 'BL Complet', url: 'http://localhost:3005/api/pdf/delivery-note/2' },
    { name: 'BL Réduit', url: 'http://localhost:3005/api/pdf/delivery-note-small/2' },
    { name: 'Ticket', url: 'http://localhost:3005/api/pdf/delivery-note-ticket/2' }
  ];
  
  for (const format of formats) {
    try {
      console.log(`\n📄 Testing ${format.name}...`);
      
      const response = await fetch(format.url, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        console.log(`✅ ${format.name} successful! Size: ${contentLength} bytes`);
      } else {
        const errorText = await response.text();
        console.error(`❌ ${format.name} failed:`, response.status, errorText);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${format.name}:`, error);
    }
  }
}

testAllPDFFormats();