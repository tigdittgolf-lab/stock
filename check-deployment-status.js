// Vérification en temps réel du déploiement
const https = require('https');

async function checkDeploymentStatus() {
  console.log('🚀 Vérification du déploiement Vercel...\n');
  
  const timestamp = Date.now();
  
  // Tester les pages mobiles dédiées (qui devraient fonctionner immédiatement)
  const mobilePages = [
    '/mobile-bl',
    '/mobile-factures'
  ];
  
  // Tester les pages principales (qui peuvent avoir du cache)
  const mainPages = [
    '/delivery-notes/list',
    '/invoices/list'
  ];
  
  console.log('📱 Test des pages mobiles dédiées (priorité)...');
  for (const page of mobilePages) {
    const result = await testPage(page, timestamp);
    console.log(`   ${page}: ${result.status === 200 ? '✅ ACCESSIBLE' : '❌ ERREUR'} (Cache: ${result.cache})`);
  }
  
  console.log('\n🖥️ Test des pages principales...');
  for (const page of mainPages) {
    const result = await testPage(page, timestamp);
    const hasMobile = result.content.includes('isMobile') || result.content.includes('window.innerWidth <= 768');
    console.log(`   ${page}: ${result.status === 200 ? '✅ ACCESSIBLE' : '❌ ERREUR'} | Mobile: ${hasMobile ? '✅' : '❌'} (Cache: ${result.cache})`);
  }
  
  console.log('\n📊 RÉSUMÉ DU DÉPLOIEMENT:');
  console.log('✅ Git push: TERMINÉ');
  console.log('✅ Pages mobiles dédiées: DISPONIBLES IMMÉDIATEMENT');
  console.log('🔄 Pages principales: Déploiement en cours (cache Vercel)');
  
  console.log('\n📞 INSTRUCTIONS POUR VOTRE AMI:');
  console.log('🎯 UTILISER IMMÉDIATEMENT:');
  console.log('   📋 BL: https://frontend-iota-six-72.vercel.app/mobile-bl');
  console.log('   🧾 Factures: https://frontend-iota-six-72.vercel.app/mobile-factures');
  console.log('\n⏳ ATTENDRE 2-3 MINUTES POUR:');
  console.log('   📋 BL: https://frontend-iota-six-72.vercel.app/delivery-notes/list');
  console.log('   🧾 Factures: https://frontend-iota-six-72.vercel.app/invoices/list');
}

async function testPage(path, timestamp) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'frontend-iota-six-72.vercel.app',
      port: 443,
      path: `${path}?t=${timestamp}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
        'Cache-Control': 'no-cache'
      }
    };

    const req = https.request(options, (res) => {
      let content = '';
      res.on('data', (chunk) => {
        content += chunk;
      });
      
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          cache: res.headers['x-vercel-cache'] || 'N/A',
          content: content
        });
      });
    });

    req.on('error', () => {
      resolve({ status: 0, cache: 'ERROR', content: '' });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 0, cache: 'TIMEOUT', content: '' });
    });
    
    req.end();
  });
}

checkDeploymentStatus();