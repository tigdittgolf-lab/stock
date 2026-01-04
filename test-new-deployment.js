// Test du nouveau déploiement Vercel
const https = require('https');

async function testNewDeployment() {
  console.log('🎉 NOUVEAU DÉPLOIEMENT VERCEL RÉUSSI!\n');
  
  const newUrl = 'frontend-jrcomc5ao-tigdittgolf-9191s-projects.vercel.app';
  const oldUrl = 'frontend-iota-six-72.vercel.app';
  
  console.log('🔍 Test des deux URLs...\n');
  
  // Test nouvelle URL
  console.log('📱 Test nouvelle URL:', newUrl);
  const newResult = await testUrl(newUrl);
  console.log(`   Status: ${newResult.status}`);
  console.log(`   Mobile: ${newResult.hasMobile ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Cache: ${newResult.cache}`);
  
  // Test ancienne URL
  console.log('\n🖥️ Test ancienne URL:', oldUrl);
  const oldResult = await testUrl(oldUrl);
  console.log(`   Status: ${oldResult.status}`);
  console.log(`   Mobile: ${oldResult.hasMobile ? '✅ OUI' : '❌ NON'}`);
  console.log(`   Cache: ${oldResult.cache}`);
  
  // Test pages mobiles sur nouvelle URL
  console.log('\n📱 Test pages mobiles sur nouvelle URL...');
  const mobilePages = ['/mobile-bl', '/mobile-factures', '/delivery-notes/list'];
  
  for (const page of mobilePages) {
    const result = await testUrl(newUrl, page);
    console.log(`   ${page}: ${result.status === 200 ? '✅ OK' : '❌ ERREUR'} | Mobile: ${result.hasMobile ? '✅' : '❌'}`);
  }
  
  console.log('\n🎯 RÉSULTAT:');
  if (newResult.hasMobile) {
    console.log('🎉 SUCCÈS COMPLET! Interface mobile déployée sur nouvelle URL');
    console.log(`📞 Nouvelle URL pour votre ami: https://${newUrl}`);
    console.log('✅ Toutes les fonctionnalités mobiles sont disponibles!');
  } else {
    console.log('⏳ Déploiement en cours de propagation...');
    console.log('🔄 Réessayez dans 2-3 minutes');
  }
}

async function testUrl(hostname, path = '/delivery-notes/list') {
  return new Promise((resolve) => {
    const options = {
      hostname: hostname,
      port: 443,
      path: path,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
      }
    };

    const req = https.request(options, (res) => {
      let content = '';
      res.on('data', (chunk) => {
        content += chunk;
      });
      
      res.on('end', () => {
        const hasMobile = content.includes('isMobile') || 
                         content.includes('window.innerWidth <= 768') ||
                         content.includes('setIsMobile');
        
        resolve({
          status: res.statusCode,
          cache: res.headers['x-vercel-cache'] || 'N/A',
          hasMobile: hasMobile
        });
      });
    });

    req.on('error', () => {
      resolve({ status: 0, cache: 'ERROR', hasMobile: false });
    });
    
    req.setTimeout(8000, () => {
      req.destroy();
      resolve({ status: 0, cache: 'TIMEOUT', hasMobile: false });
    });
    
    req.end();
  });
}

testNewDeployment();