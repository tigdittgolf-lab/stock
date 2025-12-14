// Tester les détails des BL avec vraies données
async function testBLDetails() {
  console.log('🧪 Testing BL details with REAL data...');
  
  // Test BL 1
  console.log('\n--- Testing BL 1 ---');
  try {
    const response1 = await fetch('http://localhost:3005/api/sales/delivery-notes/1', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result1 = await response1.json();
    
    if (response1.ok) {
      console.log('✅ BL 1 details:');
      console.log(`   - Date: ${result1.data.date_fact}`);
      console.log(`   - Montant HT: ${result1.data.montant_ht}`);
      console.log(`   - TVA: ${result1.data.tva}`);
      console.log(`   - TTC: ${result1.data.montant_ttc}`);
      console.log(`   - Détails: ${result1.data.details.length} ligne(s)`);
      result1.data.details.forEach((detail, i) => {
        console.log(`     Ligne ${i+1}: Article ${detail.narticle}, Qté ${detail.qte}, Prix ${detail.prix}`);
      });
    } else {
      console.error('❌ BL 1 failed:', result1);
    }
  } catch (error) {
    console.error('❌ Error testing BL 1:', error);
  }
  
  // Test BL 2
  console.log('\n--- Testing BL 2 ---');
  try {
    const response2 = await fetch('http://localhost:3005/api/sales/delivery-notes/2', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result2 = await response2.json();
    
    if (response2.ok) {
      console.log('✅ BL 2 details:');
      console.log(`   - Date: ${result2.data.date_fact}`);
      console.log(`   - Montant HT: ${result2.data.montant_ht}`);
      console.log(`   - TVA: ${result2.data.tva}`);
      console.log(`   - TTC: ${result2.data.montant_ttc}`);
      console.log(`   - Détails: ${result2.data.details.length} ligne(s)`);
      result2.data.details.forEach((detail, i) => {
        console.log(`     Ligne ${i+1}: Article ${detail.narticle}, Qté ${detail.qte}, Prix ${detail.prix}`);
      });
    } else {
      console.error('❌ BL 2 failed:', result2);
    }
  } catch (error) {
    console.error('❌ Error testing BL 2:', error);
  }
}

testBLDetails();