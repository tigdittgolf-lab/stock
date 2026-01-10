// Test de debug pour le Total TTC dans les PDF
async function testPDFTTCDebug() {
  console.log('🚀 Test de debug PDF Total TTC...');
  
  const LOCAL_BACKEND = 'http://localhost:3005';
  const LOCAL_FRONTEND = 'http://localhost:3001';
  
  console.log(`📍 Backend local: ${LOCAL_BACKEND}`);
  console.log(`📍 Frontend local: ${LOCAL_FRONTEND}`);
  
  // Test direct du backend pour générer un PDF
  console.log('\n🔍 Test direct génération PDF backend...');
  
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/pdf/delivery-note/4`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF backend: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ PDF généré avec succès!');
      console.log('📄 Content-Type:', response.headers.get('content-type'));
      console.log('📄 Content-Length:', response.headers.get('content-length'));
      
      // Les logs de debug devraient apparaître dans la console du backend
      console.log('\n🔍 Vérifiez les logs du backend pour voir:');
      console.log('   - 🔍 PDF Debug BL 4: montant_ht, tva, montant_ttc');
      console.log('   - 🔍 PDF Service - Données reçues pour BL');
      console.log('   - 🔍 PDF Service - Calcul totalTTC');
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur génération PDF:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
  }
  
  // Test via le frontend
  console.log('\n🔍 Test génération PDF via frontend...');
  
  try {
    const response = await fetch(`${LOCAL_FRONTEND}/api/pdf/delivery-note/4`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF frontend: ${response.status}`);
    
    if (response.ok) {
      console.log('✅ PDF via frontend généré avec succès!');
    } else {
      const text = await response.text();
      console.log('❌ Erreur PDF frontend:', text.substring(0, 200));
    }
    
  } catch (error) {
    console.log(`❌ Erreur frontend:`, error.message);
  }
  
  console.log('\n📋 INSTRUCTIONS:');
  console.log('1. Regardez les logs du backend pour voir les valeurs de debug');
  console.log('2. Vérifiez si montant_ht et tva ont des valeurs correctes');
  console.log('3. Vérifiez si le calcul totalTTC fonctionne');
  console.log('4. Si les valeurs sont nulles, le problème vient de la base de données');
}

testPDFTTCDebug().catch(console.error);