// Test BL details fix
async function testBLDetailsFix() {
  console.log('🧪 Testing BL details fix...');
  
  const BACKEND_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  const TENANT = '2025_bu01';
  
  try {
    // Test 1: Debug endpoint to see BL data structure
    console.log('\n1️⃣ Testing debug endpoint...');
    const debugResponse = await fetch(`${BACKEND_URL}/api/pdf/debug-bl/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': TENANT,
        'Content-Type': 'application/json'
      }
    });
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      console.log('✅ Debug endpoint response:', {
        success: debugData.success,
        hasData: !!debugData.data,
        dataKeys: debugData.dataKeys,
        detailsCount: debugData.data?.details?.length || 0
      });
      
      if (debugData.data?.details && debugData.data.details.length > 0) {
        console.log('📦 Article details found:', debugData.data.details.map(d => ({
          narticle: d.narticle,
          designation: d.designation,
          qte: d.qte,
          prix: d.prix
        })));
      } else {
        console.log('⚠️ No article details found in BL data');
      }
    } else {
      console.log(`❌ Debug endpoint failed: ${debugResponse.status}`);
    }
    
    // Test 2: BL details endpoint
    console.log('\n2️⃣ Testing BL details endpoint...');
    const detailsResponse = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': TENANT,
        'Content-Type': 'application/json'
      }
    });
    
    if (detailsResponse.ok) {
      const detailsData = await detailsResponse.json();
      console.log('✅ BL details endpoint response:', {
        success: detailsData.success,
        hasData: !!detailsData.data,
        detailsCount: detailsData.data?.details?.length || 0,
        source: detailsData.source
      });
      
      if (detailsData.data?.details && detailsData.data.details.length > 0) {
        console.log('📦 BL article details:', detailsData.data.details.map(d => ({
          narticle: d.narticle,
          designation: d.designation,
          qte: d.qte,
          prix: d.prix
        })));
        console.log('✅ SUCCESS: BL details are now working!');
      } else {
        console.log('❌ ISSUE: Still no article details in BL response');
      }
    } else {
      console.log(`❌ BL details endpoint failed: ${detailsResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBLDetailsFix();