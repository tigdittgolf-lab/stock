// Test tous les BL avec leurs vraies données
async function testAllBLRealData() {
  console.log('🧪 Testing all BL with real data...');
  
  const BACKEND_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  const TENANT = '2025_bu01';
  
  // Tester BL 1, 2, 3, 4, 5
  for (let blId = 1; blId <= 5; blId++) {
    try {
      console.log(`\n🔍 Testing BL ${blId}...`);
      const response = await fetch(`${BACKEND_URL}/api/pdf/debug-bl/${blId}`, {
        method: 'GET',
        headers: {
          'X-Tenant': TENANT,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data && data.data.details) {
          console.log(`✅ BL ${blId} - ${data.data.details.length} articles:`);
          data.data.details.forEach(article => {
            console.log(`   📦 ${article.narticle} - ${article.designation} (Qté: ${article.qte}, Prix: ${article.prix} DA)`);
          });
        } else {
          console.log(`⚠️ BL ${blId} - Pas de détails d'articles`);
        }
      } else {
        console.log(`❌ BL ${blId} - Erreur ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ BL ${blId} - Erreur: ${error.message}`);
    }
  }
}

testAllBLRealData();