// Test tous les formats PDF
async function testAllPDFFormats() {
  console.log('🧪 Testing all PDF formats...');
  
  const BACKEND_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  const TENANT = '2025_bu01';
  const BL_ID = 5;
  
  const formats = [
    { name: 'BL Complet', url: `/api/pdf/delivery-note/${BL_ID}` },
    { name: 'BL Réduit', url: `/api/pdf/delivery-note-small/${BL_ID}` },
    { name: 'Ticket', url: `/api/pdf/delivery-note-ticket/${BL_ID}` }
  ];
  
  for (const format of formats) {
    try {
      console.log(`\n📄 Testing ${format.name}...`);
      const response = await fetch(`${BACKEND_URL}${format.url}`, {
        method: 'GET',
        headers: {
          'X-Tenant': TENANT,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 ${format.name} - Status: ${response.status}`);
      
      if (response.ok) {
        const contentType = response.headers.get('content-type');
        const contentLength = response.headers.get('content-length');
        
        if (contentType && contentType.includes('application/pdf')) {
          console.log(`✅ ${format.name} - PDF généré avec succès!`);
          console.log(`📄 ${format.name} - Taille: ${contentLength} bytes`);
        } else {
          console.log(`⚠️ ${format.name} - Réponse n'est pas un PDF`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ ${format.name} - Erreur: ${response.status}`);
        console.log(`   Détails: ${errorText.substring(0, 200)}`);
      }
      
    } catch (error) {
      console.log(`❌ ${format.name} - Exception: ${error.message}`);
    }
  }
  
  console.log('\n🎉 Test des formats PDF terminé!');
}

testAllPDFFormats();