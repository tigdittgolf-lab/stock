// Vérifier spécifiquement le montant TTC du BL 2
async function testBL2TTC() {
  console.log('🧪 Testing BL 2 TTC calculation...');
  
  try {
    const response = await fetch('http://localhost:3005/api/sales/delivery-notes/2', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ BL 2 API Response:');
      console.log('📊 Montants:');
      console.log(`   - montant_ht: ${result.data.montant_ht} (type: ${typeof result.data.montant_ht})`);
      console.log(`   - tva: ${result.data.tva} (type: ${typeof result.data.tva})`);
      console.log(`   - montant_ttc: ${result.data.montant_ttc} (type: ${typeof result.data.montant_ttc})`);
      
      // Vérifier le calcul
      const calculatedTTC = parseFloat(result.data.montant_ht) + parseFloat(result.data.tva);
      console.log(`   - Calcul TTC: ${result.data.montant_ht} + ${result.data.tva} = ${calculatedTTC}`);
      
      console.log('\n📋 Données complètes:');
      console.log(JSON.stringify(result.data, null, 2));
      
    } else {
      console.error('❌ API failed:', result);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBL2TTC();