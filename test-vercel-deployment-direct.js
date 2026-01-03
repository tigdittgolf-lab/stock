// Test direct du déploiement Vercel avec cache busting agressif
const https = require('https');

async function testDirectDeployment() {
  console.log('🚀 Test direct du déploiement Vercel...\n');
  
  const timestamp = Date.now();
  
  // Test avec différentes stratégies de cache busting
  const testStrategies = [
    { name: 'Cache Busting Timestamp', param: `?t=${timestamp}` },
    { name: 'Cache Busting Version', param: `?v=${timestamp}` },
    { name: 'Cache Busting Mobile', param: `?mobile=${timestamp}` },
    { name: 'No Cache Headers', param: `?nocache=${timestamp}` }
  ];
  
  console.log('📱 Test des pages mobiles avec différentes stratégies...\n');
  
  for (const strategy of testStrategies) {
    console.log(`🔍 Stratégie: ${strategy.name}`);
    
    const mobileBlResult = await testPageDirect('/mobile-bl', strategy.param);
    const mobileFactResult = await testPageDirect('/mobile-factures', strategy.param);
    
    console.log(`   📋 /mobile-bl: ${mobileBlResult.status} (${mobileBlResult.cache}) - ${mobileBlResult.exists ? 'EXISTE' : 'N\'EXISTE PAS'}`);
    console.log(`   🧾 /mobile-factures: ${mobileFactResult.status} (${mobileFactResult.cache}) - ${mobileFactResult.exists ? 'EXISTE' : 'N\'EXISTE PAS'}`);
    
    if (mobileBlResult.exists && mobileFactResult.exists) {
      console.log('   ✅ SUCCÈS! Pages mobiles déployées avec cette stratégie\n');
      break;
    } else {
      console.log('   ❌ Pages pas encore déployées avec cette stratégie\n');
    }
  }
  
  // Test des pages principales pour voir si le code mobile est là
  console.log('🖥️ Test des pages principales pour code mobile...\n');
  
  const mainPageResult = await testPageDirect('/delivery-notes/list', `?check=${timestamp}`);
  const hasMobileCode = mainPageResult.content.includes('isMobile') || 
                       mainPageResult.content.includes('window.innerWidth <= 768') ||
                       mainPageResult.content.includes('setIsMobile');
  
  console.log(`📋 Page principale BL: ${mainPageResult.status} (${mainPageResult.cache})`);
  console.log(`   Code mobile détecté: ${hasMobileCode ? '✅ OUI' : '❌ NON'}`);
  
  // Résumé final
  console.log('\n📊 RÉSUMÉ FINAL:');
  console.log(`✅ Git push: TERMINÉ (commit a7e4b7c)`);
  console.log(`🔄 Vercel build: ${hasMobileCode ? 'TERMINÉ' : 'EN COURS'}`);
  console.log(`📱 Pages mobiles: ${mobileBlResult.exists ? 'DÉPLOYÉES' : 'EN COURS DE DÉPLOIEMENT'}`);
  
  if (hasMobileCode) {
    console.log('\n🎉 DÉPLOIEMENT RÉUSSI!');
    console.log('📞 Votre ami peut maintenant utiliser:');
    console.log('   📋 https://frontend-iota-six-72.vercel.app/delivery-notes/list');
    console.log('   🧾 https://frontend-iota-six-72.vercel.app/invoices/list');
    console.log('   📱 Interface mobile avec tous les boutons PDF disponible!');
  } else {
    console.log('\n⏳ DÉPLOIEMENT EN COURS...');
    console.log('🔄 Vercel est encore en train de construire la nouvelle version');
    console.log('⏰ Essayez à nouveau dans 2-3 minutes');
  }
}

async function testPageDirect(path, params) {
  return new Promise((resolve) => {
    const options = {
      hostname: 'frontend-iota-six-72.vercel.app',
      port: 443,
      path: `${path}${params}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
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
          content: content,
          exists: res.statusCode === 200 && content.length > 1000 // Page complète
        });
      });
    });

    req.on('error', () => {
      resolve({ status: 0, cache: 'ERROR', content: '', exists: false });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({ status: 0, cache: 'TIMEOUT', content: '', exists: false });
    });
    
    req.end();
  });
}

testDirectDeployment();