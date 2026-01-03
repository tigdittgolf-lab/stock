// Test PDF generation through production frontend
async function testProductionPDF() {
  try {
    console.log('🔍 Testing PDF generation through production frontend...');
    
    const response = await fetch('https://frontend-qd42ozf8q-tigdittgolf-9191s-projects.vercel.app/api/pdf/delivery-note/5', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    console.log('📊 Response headers:', Object.fromEntries(response.headers.entries()));
    
    if (response.status === 200) {
      console.log('✅ PDF generated successfully through production!');
      console.log('📄 Content-Type:', response.headers.get('content-type'));
      console.log('📄 Content-Length:', response.headers.get('content-length'));
      console.log('📄 Content-Disposition:', response.headers.get('content-disposition'));
    } else {
      const text = await response.text();
      console.log('❌ Error response:', text);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testProductionPDF();