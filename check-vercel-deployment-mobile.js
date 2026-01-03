// Script to check if Vercel deployment is complete with mobile fixes
const https = require('https');

const VERCEL_URL = 'https://frontend-iota-six-72.vercel.app';

function checkDeployment() {
  console.log('🔍 Checking Vercel deployment status...');
  
  const options = {
    hostname: 'frontend-iota-six-72.vercel.app',
    port: 443,
    path: '/delivery-notes/list',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    }
  };

  const req = https.request(options, (res) => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    console.log(`📋 Headers:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200) {
        // Check if the mobile responsive code is present
        const hasMobileCode = data.includes('isMobile') && data.includes('window.innerWidth <= 768');
        const hasCardLayout = data.includes('borderRadius: \'10px\'') && data.includes('marginBottom: \'15px\'');
        
        if (hasMobileCode && hasCardLayout) {
          console.log('✅ DEPLOYMENT SUCCESS: Mobile responsive code is live!');
          console.log('📱 Mobile detection and card layouts are deployed');
          console.log('🎯 Your friend should now see the mobile-friendly interface on iPhone');
        } else {
          console.log('⚠️ DEPLOYMENT PENDING: Mobile code not yet deployed');
          console.log('⏳ Please wait a few more minutes for Vercel to complete deployment');
        }
      } else {
        console.log('❌ DEPLOYMENT ISSUE: Unexpected status code');
      }
    });
  });

  req.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
  });

  req.end();
}

// Check deployment status
checkDeployment();

// Check again in 30 seconds
setTimeout(() => {
  console.log('\n🔄 Checking again after 30 seconds...');
  checkDeployment();
}, 30000);