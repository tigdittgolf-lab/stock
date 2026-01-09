// Test BL details in production
async function testProductionBLDetails() {
  console.log('🧪 Testing BL details in production...');
  
  const PRODUCTION_URL = 'https://frontend-inec2q821-tigdittgolf-9191s-projects.vercel.app';
  const TENANT = '2025_bu01';
  
  try {
    // Test BL details endpoint in production
    console.log('\n🌐 Testing production BL details endpoint...');
    const response = await fetch(`${PRODUCTION_URL}/api/sales/delivery-notes/5`, {
      method: 'GET',
      headers: {
        'X-Tenant': TENANT,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Production BL details response:', {
        success: data.success,
        hasData: !!data.data,
        detailsCount: data.data?.details?.length || 0,
        source: data.source
      });
      
      if (data.data?.details && data.data.details.length > 0) {
        console.log('📦 Production BL article details:', data.data.details.map(d => ({
          narticle: d.narticle,
          designation: d.designation,
          qte: d.qte,
          prix: d.prix
        })));
        console.log('🎉 SUCCESS: Production BL details are working!');
        
        // Test debug endpoint too
        console.log('\n🔍 Testing production debug endpoint...');
        const debugResponse = await fetch(`${PRODUCTION_URL}/api/pdf/debug-bl/5`, {
          method: 'GET',
          headers: {
            'X-Tenant': TENANT,
            'Content-Type': 'application/json'
          }
        });
        
        if (debugResponse.ok) {
          const debugData = await debugResponse.json();
          console.log('✅ Production debug response:', {
            success: debugData.success,
            detailsCount: debugData.data?.details?.length || 0
          });
        } else {
          console.log(`⚠️ Production debug failed: ${debugResponse.status}`);
        }
        
      } else {
        console.log('❌ ISSUE: Still no article details in production');
      }
    } else {
      console.log(`❌ Production BL details failed: ${response.status}`);
      const errorText = await response.text();
      console.log('Error details:', errorText.substring(0, 200));
    }
    
  } catch (error) {
    console.error('❌ Production test failed:', error);
  }
}

testProductionBLDetails();