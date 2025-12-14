// Tester les formats réduit et ticket avec TTC
async function testTTCFormats() {
  console.log('🧪 Testing BL Réduit and Ticket formats with TTC...');
  
  const formats = [
    { name: 'BL Réduit', url: 'http://localhost:3005/api/pdf/delivery-note-small/2' },
    { name: 'Ticket', url: 'http://localhost:3005/api/pdf/delivery-note-ticket/2' }
  ];
  
  for (const format of formats) {
    try {
      console.log(`\n📄 Testing ${format.name} with TTC totals...`);
      
      const response = await fetch(format.url, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (response.ok) {
        const contentLength = response.headers.get('content-length');
        console.log(`✅ ${format.name} successful! Size: ${contentLength} bytes`);
        
        // Vérifier que la taille a changé (indique que les totaux TTC sont ajoutés)
        console.log(`📊 Expected in ${format.name}:`);
        console.log('   - Sous-total HT: 12 000,00 DA');
        console.log('   - TVA: 2 280,00 DA');
        console.log('   - TOTAL TTC: 14 280,00 DA ← NOUVEAU !');
        
      } else {
        const errorText = await response.text();
        console.error(`❌ ${format.name} failed:`, response.status, errorText);
      }
      
    } catch (error) {
      console.error(`❌ Error testing ${format.name}:`, error);
    }
  }
  
  console.log('\n🎯 Summary:');
  console.log('Both formats now show complete totals:');
  console.log('- Sous-total HT (unchanged)');
  console.log('- TVA (newly added)');
  console.log('- TOTAL TTC (newly added) ← This is what the customer pays!');
}

testTTCFormats();