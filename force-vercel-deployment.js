// Force Vercel deployment by checking deployment status
const https = require('https');

async function checkVercelDeployments() {
  console.log('🔍 Checking latest Vercel deployments...');
  
  // Check the main app
  const options = {
    hostname: 'frontend-iota-six-72.vercel.app',
    port: 443,
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      console.log(`📊 Main app status: ${res.statusCode}`);
      console.log(`🕒 Date: ${res.headers.date}`);
      console.log(`🏷️ ETag: ${res.headers.etag}`);
      console.log(`💾 Cache: ${res.headers['x-vercel-cache']}`);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          etag: res.headers.etag,
          cache: res.headers['x-vercel-cache'],
          hasReactCode: data.includes('_app')
        });
      });
    });

    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const result = await checkVercelDeployments();
    console.log('\n📋 Deployment Status Summary:');
    console.log(`✅ App is accessible: ${result.status === 200 ? 'YES' : 'NO'}`);
    console.log(`💾 Cache status: ${result.cache}`);
    console.log(`🏷️ Current ETag: ${result.etag}`);
    
    if (result.cache === 'HIT') {
      console.log('\n⚠️ Vercel is serving cached content');
      console.log('🔄 The deployment may still be in progress');
      console.log('⏳ Typical deployment time: 1-3 minutes');
      console.log('\n💡 Solutions:');
      console.log('1. Wait 2-3 more minutes for automatic deployment');
      console.log('2. Try accessing with cache-busting: ?v=' + Date.now());
      console.log('3. Check Vercel dashboard for deployment status');
    } else {
      console.log('\n✅ Fresh content is being served');
    }
    
  } catch (error) {
    console.error('❌ Error checking deployment:', error.message);
  }
}

main();