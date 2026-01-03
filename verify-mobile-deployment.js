// Verify mobile deployment is live
const https = require('https');

async function verifyMobileDeployment() {
  console.log('🔍 Verifying mobile deployment...');
  
  // Test the delivery notes list page with cache busting
  const timestamp = Date.now();
  const testUrl = `/delivery-notes/list?v=${timestamp}`;
  
  const options = {
    hostname: 'frontend-iota-six-72.vercel.app',
    port: 443,
    path: testUrl,
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 Status: ${res.statusCode}`);
      console.log(`💾 Cache: ${res.headers['x-vercel-cache'] || 'N/A'}`);
      console.log(`🏷️ ETag: ${res.headers.etag || 'N/A'}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        // Check for mobile-specific code
        const checks = {
          hasMobileDetection: data.includes('window.innerWidth <= 768'),
          hasCardLayout: data.includes('borderRadius: \'10px\'') && data.includes('marginBottom: \'15px\''),
          hasTouchButtons: data.includes('padding: \'12px 20px\'') || data.includes('padding: \'10px\''),
          hasResponsiveGrid: data.includes('isMobile ? \'column\' : \'row\''),
          hasFlexWrap: data.includes('flexWrap: \'wrap\'')
        };
        
        const mobileFeatures = Object.values(checks).filter(Boolean).length;
        const totalFeatures = Object.keys(checks).length;
        
        console.log('\n📱 Mobile Features Check:');
        Object.entries(checks).forEach(([feature, present]) => {
          console.log(`${present ? '✅' : '❌'} ${feature}: ${present ? 'PRESENT' : 'MISSING'}`);
        });
        
        console.log(`\n📊 Mobile Readiness: ${mobileFeatures}/${totalFeatures} features detected`);
        
        if (mobileFeatures >= 3) {
          console.log('🎉 MOBILE DEPLOYMENT SUCCESSFUL!');
          console.log('📱 Your friend should now see the mobile-friendly interface');
          console.log('🔗 Share this link: https://frontend-iota-six-72.vercel.app');
        } else if (mobileFeatures >= 1) {
          console.log('⚠️ PARTIAL DEPLOYMENT - Some mobile features detected');
          console.log('⏳ Full deployment may still be in progress');
        } else {
          console.log('❌ MOBILE FEATURES NOT YET DEPLOYED');
          console.log('⏳ Please wait 2-3 more minutes for Vercel deployment');
        }
        
        resolve({
          status: res.statusCode,
          mobileFeatures,
          totalFeatures,
          isDeployed: mobileFeatures >= 3
        });
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request failed:', error.message);
      reject(error);
    });

    req.end();
  });
}

async function main() {
  try {
    console.log('🚀 Starting mobile deployment verification...\n');
    
    const result = await verifyMobileDeployment();
    
    console.log('\n📋 SUMMARY:');
    console.log(`✅ HTTP Status: ${result.status}`);
    console.log(`📱 Mobile Features: ${result.mobileFeatures}/${result.totalFeatures}`);
    console.log(`🎯 Deployment Status: ${result.isDeployed ? 'COMPLETE' : 'IN PROGRESS'}`);
    
    if (result.isDeployed) {
      console.log('\n🎉 SUCCESS! Mobile interface is now live!');
      console.log('📞 Tell your friend to:');
      console.log('1. Open https://frontend-iota-six-72.vercel.app on iPhone');
      console.log('2. Login with the same credentials');
      console.log('3. Navigate to BL or Invoice lists');
      console.log('4. Enjoy the mobile-friendly interface!');
    } else {
      console.log('\n⏳ Deployment still in progress...');
      console.log('🔄 Vercel typically takes 2-3 minutes for full deployment');
      console.log('💡 Try running this script again in 1-2 minutes');
    }
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

main();