// Debug Vercel deployment issue
const https = require('https');

async function debugDeployment() {
  console.log('🔍 Debugging Vercel deployment...');
  
  // Test multiple endpoints to understand the deployment status
  const endpoints = [
    '/',
    '/delivery-notes/list',
    '/invoices/list',
    '/dashboard'
  ];
  
  for (const endpoint of endpoints) {
    console.log(`\n📍 Testing: ${endpoint}`);
    
    try {
      const result = await testEndpoint(endpoint);
      console.log(`   Status: ${result.status}`);
      console.log(`   Cache: ${result.cache}`);
      console.log(`   ETag: ${result.etag}`);
      console.log(`   Has React: ${result.hasReact ? 'YES' : 'NO'}`);
      console.log(`   Content Length: ${result.contentLength}`);
      
      if (endpoint === '/delivery-notes/list') {
        console.log(`   Has Mobile Code: ${result.hasMobileCode ? 'YES' : 'NO'}`);
      }
    } catch (error) {
      console.log(`   ERROR: ${error.message}`);
    }
  }
  
  // Check if this is a build issue
  console.log('\n🔧 Possible Issues:');
  console.log('1. Vercel build queue delay');
  console.log('2. Next.js build error');
  console.log('3. CDN cache persistence');
  console.log('4. Deployment hook not triggered');
  
  console.log('\n💡 Solutions:');
  console.log('1. Wait 5-10 minutes total');
  console.log('2. Check Vercel dashboard');
  console.log('3. Force redeploy if needed');
  console.log('4. Use cache-busting URLs');
}

async function testEndpoint(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'frontend-iota-six-72.vercel.app',
      port: 443,
      path: path + '?t=' + Date.now(),
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        'Cache-Control': 'no-cache'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          cache: res.headers['x-vercel-cache'] || 'N/A',
          etag: res.headers.etag || 'N/A',
          contentLength: res.headers['content-length'] || 'N/A',
          hasReact: data.includes('_app') || data.includes('__next'),
          hasMobileCode: data.includes('isMobile') || data.includes('window.innerWidth <= 768')
        });
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
}

debugDeployment();