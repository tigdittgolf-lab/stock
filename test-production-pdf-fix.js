// Test de la correction du Total TTC en production
async function testProductionPDFFix() {
  console.log('🚀 Test de la correction Total TTC en production...');
  
  const PRODUCTION_URL = 'https://frontend-7b9x59gqg-tigdittgolf-9191s-projects.vercel.app';
  
  console.log(`📍 URL de production: ${PRODUCTION_URL}`);
  
  // Test du BL 3 en production
  console.log('\n🔍 Test PDF BL 3 en production...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/pdf/delivery-note/3`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF BL 3: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ PDF BL 3 généré avec succès en production!');
      console.log('📄 Content-Length:', response.headers.get('content-length'));
      
      // Sauvegarder le PDF pour vérification
      const buffer = await response.arrayBuffer();
      const fs = require('fs');
      fs.writeFileSync('test_bl_3_production_fixed.pdf', Buffer.from(buffer));
      console.log('💾 PDF sauvegardé: test_bl_3_production_fixed.pdf');
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur génération PDF BL 3:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
  }
  
  // Test du BL 4 en production
  console.log('\n🔍 Test PDF BL 4 en production...');
  
  try {
    const response = await fetch(`${PRODUCTION_URL}/api/pdf/delivery-note/4`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF BL 4: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ PDF BL 4 généré avec succès en production!');
      console.log('📄 Content-Length:', response.headers.get('content-length'));
      
      // Sauvegarder le PDF pour vérification
      const buffer = await response.arrayBuffer();
      const fs = require('fs');
      fs.writeFileSync('test_bl_4_production_fixed.pdf', Buffer.from(buffer));
      console.log('💾 PDF sauvegardé: test_bl_4_production_fixed.pdf');
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur génération PDF BL 4:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
  }
  
  console.log('\n📋 VÉRIFICATIONS:');
  console.log('1. Ouvrez test_bl_3_production_fixed.pdf');
  console.log('2. Ouvrez test_bl_4_production_fixed.pdf');
  console.log('3. Vérifiez que le Total TTC s\'affiche maintenant correctement');
  console.log('4. Comparez avec les anciens PDFs qui avaient le problème');
}

testProductionPDFFix().catch(console.error);