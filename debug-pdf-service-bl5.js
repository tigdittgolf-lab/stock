// Debug spécifique du service PDF pour BL 5
async function debugPDFServiceBL5() {
  console.log('🔍 Debug service PDF BL 5...');
  
  const LOCAL_BACKEND = 'http://localhost:3005';
  
  // Test debug PDF avec logs détaillés
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/pdf/debug-bl/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug réussi!');
      
      // Analyser les données exactes
      const blData = data.data;
      console.log('\n📋 ANALYSE DÉTAILLÉE:');
      console.log('montant_ht:', blData.montant_ht, '(type:', typeof blData.montant_ht, ')');
      console.log('tva:', blData.tva, '(type:', typeof blData.tva, ')');
      console.log('montant_ttc:', blData.montant_ttc, '(type:', typeof blData.montant_ttc, ')');
      console.log('timbre:', blData.timbre, '(type:', typeof blData.timbre, ')');
      console.log('autre_taxe:', blData.autre_taxe, '(type:', typeof blData.autre_taxe, ')');
      
      // Test des conditions
      console.log('\n🧪 TEST DES CONDITIONS:');
      console.log('montant_ht !== undefined:', blData.montant_ht !== undefined);
      console.log('montant_ht != null:', blData.montant_ht != null);
      console.log('montant_ht > 0:', blData.montant_ht > 0);
      
      // Calcul manuel
      const calculatedTTC = (blData.montant_ht || 0) + (blData.tva || 0) + (blData.timbre || 0) + (blData.autre_taxe || 0);
      console.log('\n💰 CALCUL MANUEL:');
      console.log('Calculated TTC:', calculatedTTC);
      console.log('Should display:', calculatedTTC > 0 ? 'YES' : 'NO');
      
      // Test formatAmount
      const { formatAmount } = require('./backend/src/utils/numberFormatter.js');
      console.log('\n🎨 TEST FORMATAGE:');
      console.log('formatAmount(calculatedTTC):', formatAmount(calculatedTTC));
      
    } else {
      const text = await response.text();
      console.log('❌ Erreur:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
  }
}

debugPDFServiceBL5().catch(console.error);