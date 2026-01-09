async function testDeployment() {
  try {
    console.log('🚀 Testing deployment...');
    
    const deploymentUrl = 'https://stock-management-backend-7jr8k17qv-tigdittgolf-9191s-projects.vercel.app';
    
    // Test basic health check
    console.log('\n📊 Testing health endpoint...');
    try {
      const healthResponse = await fetch(`${deploymentUrl}/health`);
      console.log(`Health Status: ${healthResponse.status}`);
      if (healthResponse.ok) {
        const healthData = await healthResponse.text();
        console.log(`Health Response: ${healthData}`);
      }
    } catch (error) {
      console.log(`❌ Health check failed: ${error.message}`);
    }
    
    // Test API root
    console.log('\n📋 Testing API root...');
    try {
      const apiResponse = await fetch(`${deploymentUrl}/`);
      console.log(`API Root Status: ${apiResponse.status}`);
      if (apiResponse.ok) {
        const apiData = await apiResponse.text();
        console.log(`API Response length: ${apiData.length} chars`);
      }
    } catch (error) {
      console.log(`❌ API root failed: ${error.message}`);
    }
    
    // Test PDF endpoint (should require auth)
    console.log('\n📄 Testing PDF endpoint...');
    try {
      const pdfResponse = await fetch(`${deploymentUrl}/api/pdf/delivery-note/5`, {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      console.log(`PDF Status: ${pdfResponse.status}`);
      if (pdfResponse.status === 401) {
        console.log('✅ PDF endpoint properly protected (401 Unauthorized)');
      } else if (pdfResponse.ok) {
        console.log('✅ PDF endpoint accessible');
      }
    } catch (error) {
      console.log(`❌ PDF test failed: ${error.message}`);
    }
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
  }
}

testDeployment();