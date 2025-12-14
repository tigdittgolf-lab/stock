// Tester la génération PDF avec les vraies données
async function testPDFRealData() {
  console.log('🧪 Testing PDF generation with REAL data...');
  
  // Test du debug endpoint pour voir les données utilisées par le PDF
  try {
    const debugResponse = await fetch('http://localhost:3005/api/pdf/debug-bl/2', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const debugResult = await debugResponse.json();
    
    if (debugResponse.ok) {
      console.log('✅ PDF Debug data for BL 2:');
      console.log('📊 Montants:');
      console.log(`   - montant_ht: ${debugResult.data?.montant_ht}`);
      console.log(`   - tva: ${debugResult.data?.tva}`);
      console.log(`   - montant_ttc: ${debugResult.data?.montant_ttc}`);
      
      console.log('📋 Détails:');
      if (debugResult.data?.details) {
        debugResult.data.details.forEach((detail, i) => {
          console.log(`   Ligne ${i+1}: ${detail.narticle} - ${detail.designation}`);
          console.log(`     Qté: ${detail.qte}, Prix: ${detail.prix}, Total: ${detail.total_ligne}`);
        });
      }
    } else {
      console.error('❌ Debug failed:', debugResult);
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF debug:', error);
  }
  
  // Test de génération PDF réelle
  try {
    console.log('\n🧪 Testing actual PDF generation...');
    const pdfResponse = await fetch('http://localhost:3005/api/pdf/delivery-note/2', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (pdfResponse.ok) {
      console.log('✅ PDF generation successful!');
      console.log(`📄 Content-Type: ${pdfResponse.headers.get('content-type')}`);
      console.log(`📄 Content-Length: ${pdfResponse.headers.get('content-length')}`);
    } else {
      const errorText = await pdfResponse.text();
      console.error('❌ PDF generation failed:', pdfResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Error testing PDF generation:', error);
  }
}

testPDFRealData();