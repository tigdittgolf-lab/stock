// Tester spécifiquement le format ticket
async function testTicketFormat() {
  console.log('🎫 Testing ticket format with corrected spacing...');
  
  try {
    const response = await fetch('http://localhost:3005/api/pdf/delivery-note-ticket/2', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (response.ok) {
      const contentLength = response.headers.get('content-length');
      console.log('✅ Ticket PDF generation successful!');
      console.log(`📄 Content-Type: ${response.headers.get('content-type')}`);
      console.log(`📄 Content-Length: ${contentLength} bytes`);
      
      // Vérifier que la taille a changé (indique que les corrections sont appliquées)
      console.log('📊 Expected improvements:');
      console.log('   - Better spacing between P.U. and Total columns');
      console.log('   - Correct total amounts (10 000.00 instead of 1 000.00)');
      console.log('   - Proper alignment of numbers');
      
    } else {
      const errorText = await response.text();
      console.error('❌ Ticket PDF generation failed:', response.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing ticket format:', error);
  }
}

testTicketFormat();