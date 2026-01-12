// Test direct du PDF BL 5 en production
async function testProductionPDFBL5Direct() {
  console.log('🎯 Test direct PDF BL 5 en production...');
  
  const PRODUCTION_URL = 'https://frontend-iota-six-72.vercel.app';
  
  // Test direct de la génération PDF
  console.log('\n📄 Test génération PDF BL 5...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/pdf/delivery-note/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF: ${response.status}`);
    console.log(`📊 Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.status === 401) {
      console.log('🔒 Authentification requise - Testez via l\'interface web');
      
    } else if (response.ok) {
      console.log('✅ PDF généré avec succès!');
      console.log('📄 Content-Length:', response.headers.get('content-length'));
      console.log('📄 Content-Type:', response.headers.get('content-type'));
      
      // Sauvegarder le PDF pour vérification
      const buffer = await response.arrayBuffer();
      const fs = require('fs');
      fs.writeFileSync('test_bl_5_production_final.pdf', Buffer.from(buffer));
      console.log('💾 PDF sauvegardé: test_bl_5_production_final.pdf');
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur PDF:', response.status);
      console.log('📋 Détails:', text.substring(0, 500));
    }
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
  }
  
  // Test debug PDF
  console.log('\n🔍 Test debug PDF BL 5...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/pdf/debug-bl/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status debug: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug réussi!');
      console.log('📋 Données debug:', {
        montant_ht: data.data?.montant_ht,
        tva: data.data?.tva,
        montant_ttc: data.data?.montant_ttc,
        timbre: data.data?.timbre,
        autre_taxe: data.data?.autre_taxe
      });
      
      // Vérifier le calcul
      const expectedTTC = (data.data?.montant_ht || 0) + (data.data?.tva || 0);
      console.log('💰 Calcul attendu:', expectedTTC);
      console.log('✅ Correction active:', data.data?.montant_ttc === expectedTTC ? 'OUI' : 'NON');
      
    } else if (response.status === 401) {
      console.log('🔒 Debug protégé par authentification');
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur debug:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`❌ Erreur debug:`, error.message);
  }
  
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Si vous voyez "🔒 Authentification requise", c\'est normal');
  console.log('2. Testez via l\'interface web: cliquez sur "📄 BL Complet"');
  console.log('3. Vérifiez que le Total TTC affiche: 1 190,00 DA');
  console.log('4. Si le problème persiste, envoyez-moi une capture d\'écran');
}

testProductionPDFBL5Direct().catch(console.error);