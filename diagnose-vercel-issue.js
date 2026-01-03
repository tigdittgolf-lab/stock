// Diagnostic du problème de déploiement Vercel
const https = require('https');

async function diagnoseVercelIssue() {
  console.log('🔍 DIAGNOSTIC DU PROBLÈME VERCEL\n');
  
  // 1. Vérifier si l'application Vercel répond
  console.log('1️⃣ Test de connectivité Vercel...');
  const connectivityTest = await testConnectivity();
  console.log(`   Status: ${connectivityTest.status}`);
  console.log(`   Response time: ${connectivityTest.responseTime}ms`);
  console.log(`   Vercel headers: ${connectivityTest.hasVercelHeaders ? 'OUI' : 'NON'}`);
  
  // 2. Vérifier les en-têtes de déploiement
  console.log('\n2️⃣ Vérification des en-têtes de déploiement...');
  const deploymentHeaders = await getDeploymentHeaders();
  console.log(`   X-Vercel-Cache: ${deploymentHeaders.cache}`);
  console.log(`   X-Vercel-ID: ${deploymentHeaders.id}`);
  console.log(`   ETag: ${deploymentHeaders.etag}`);
  console.log(`   Last-Modified: ${deploymentHeaders.lastModified}`);
  
  // 3. Tester différentes pages
  console.log('\n3️⃣ Test des différentes pages...');
  const pages = ['/', '/login', '/dashboard', '/delivery-notes/list'];
  for (const page of pages) {
    const result = await testPage(page);
    console.log(`   ${page}: ${result.status} (${result.cache}) - ${result.size} bytes`);
  }
  
  // 4. Diagnostic du problème
  console.log('\n🔍 DIAGNOSTIC:');
  
  if (!connectivityTest.hasVercelHeaders) {
    console.log('❌ PROBLÈME: L\'application ne semble pas être sur Vercel');
    console.log('💡 SOLUTION: Vérifier la configuration Vercel');
  } else if (deploymentHeaders.cache === 'HIT' && deploymentHeaders.lastModified) {
    const lastModified = new Date(deploymentHeaders.lastModified);
    const now = new Date();
    const minutesAgo = Math.floor((now - lastModified) / (1000 * 60));
    
    console.log(`✅ Application sur Vercel détectée`);
    console.log(`📅 Dernière modification: il y a ${minutesAgo} minutes`);
    
    if (minutesAgo > 30) {
      console.log('❌ PROBLÈME: Déploiement pas déclenché depuis GitHub');
      console.log('💡 SOLUTIONS POSSIBLES:');
      console.log('   1. Webhook GitHub → Vercel cassé');
      console.log('   2. Branche de déploiement incorrecte');
      console.log('   3. Build Vercel en erreur');
      console.log('   4. Limite de déploiement atteinte');
    } else {
      console.log('🔄 DÉPLOIEMENT RÉCENT: Peut être en cours');
    }
  }
  
  // 5. Solutions recommandées
  console.log('\n💡 SOLUTIONS RECOMMANDÉES:');
  console.log('1. 🌐 Aller sur https://vercel.com/dashboard');
  console.log('2. 🔍 Vérifier les déploiements récents');
  console.log('3. 🔄 Forcer un redéploiement manuel');
  console.log('4. ⚙️ Vérifier la configuration GitHub');
  console.log('5. 📋 Vérifier les logs de build');
  
  // 6. Test de force refresh
  console.log('\n6️⃣ Test de force refresh...');
  const forceRefresh = await testForceRefresh();
  console.log(`   Force refresh: ${forceRefresh.status}`);
  console.log(`   Cache bypass: ${forceRefresh.cacheBypass ? 'RÉUSSI' : 'ÉCHEC'}`);
}

async function testConnectivity() {
  const start = Date.now();
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'frontend-iota-six-72.vercel.app',
      port: 443,
      path: '/',
      method: 'HEAD'
    }, (res) => {
      const responseTime = Date.now() - start;
      resolve({
        status: res.statusCode,
        responseTime,
        hasVercelHeaders: !!res.headers['x-vercel-id']
      });
    });
    
    req.on('error', () => {
      resolve({ status: 0, responseTime: 0, hasVercelHeaders: false });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({ status: 0, responseTime: 5000, hasVercelHeaders: false });
    });
    
    req.end();
  });
}

async function getDeploymentHeaders() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'frontend-iota-six-72.vercel.app',
      port: 443,
      path: '/',
      method: 'HEAD'
    }, (res) => {
      resolve({
        cache: res.headers['x-vercel-cache'] || 'N/A',
        id: res.headers['x-vercel-id'] || 'N/A',
        etag: res.headers['etag'] || 'N/A',
        lastModified: res.headers['last-modified'] || 'N/A'
      });
    });
    
    req.on('error', () => {
      resolve({ cache: 'ERROR', id: 'ERROR', etag: 'ERROR', lastModified: 'ERROR' });
    });
    
    req.end();
  });
}

async function testPage(path) {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'frontend-iota-six-72.vercel.app',
      port: 443,
      path: path,
      method: 'HEAD'
    }, (res) => {
      resolve({
        status: res.statusCode,
        cache: res.headers['x-vercel-cache'] || 'N/A',
        size: res.headers['content-length'] || 'N/A'
      });
    });
    
    req.on('error', () => {
      resolve({ status: 0, cache: 'ERROR', size: 'ERROR' });
    });
    
    req.end();
  });
}

async function testForceRefresh() {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'frontend-iota-six-72.vercel.app',
      port: 443,
      path: `/?force=${Date.now()}`,
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    }, (res) => {
      resolve({
        status: res.statusCode,
        cacheBypass: res.headers['x-vercel-cache'] !== 'HIT'
      });
    });
    
    req.on('error', () => {
      resolve({ status: 0, cacheBypass: false });
    });
    
    req.end();
  });
}

diagnoseVercelIssue();