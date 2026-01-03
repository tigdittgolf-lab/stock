// Test simple pour le probleme PDF
console.log('Test PDF diagnostic...');

async function testPDF() {
  try {
    // Test backend health
    console.log('Testing backend...');
    const health = await fetch('http://localhost:3005/health');
    console.log('Backend status:', health.status);
    
    // Test delivery notes list
    console.log('Testing delivery notes...');
    const blResponse = await fetch('http://localhost:3005/api/sales/delivery-notes', {
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    const blData = await blResponse.json();
    console.log('BL Response:', {
      success: blData.success,
      count: blData.data ? blData.data.length : 0
    });
    
    if (blData.data && blData.data.length > 0) {
      const firstBL = blData.data[0];
      console.log('First BL ID:', firstBL.nbl);
      
      // Test PDF generation
      console.log('Testing PDF generation...');
      const pdfResponse = await fetch(`http://localhost:3005/api/pdf/delivery-note/${firstBL.nbl}`, {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      console.log('PDF Response:', {
        status: pdfResponse.status,
        statusText: pdfResponse.statusText
      });
      
      if (!pdfResponse.ok) {
        const errorData = await pdfResponse.json();
        console.log('PDF Error:', errorData);
      }
    }
    
  } catch (error) {
    console.error('Test error:', error.message);
  }
}

testPDF();