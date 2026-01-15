// Test rapide du déploiement
const testDeployment = async () => {
  const baseUrl = 'https://frontend-iota-six-72.vercel.app';
  
  console.log('🧪 Test rapide du déploiement');
  console.log('📍 URL:', baseUrl);
  console.log('');
  
  try {
    // Test de la page d'accueil
    console.log('🏠 Test de la page d\'accueil...');
    const homeResponse = await fetch(baseUrl);
    console.log(`   Status: ${homeResponse.status} ${homeResponse.statusText}`);
    
    if (homeResponse.ok) {
      console.log('   ✅ Page d\'accueil accessible');
    } else {
      console.log('   ❌ Page d\'accueil inaccessible');
    }
    
    // Test de l'API health
    console.log('');
    console.log('🔍 Test de l\'API health...');
    const healthUrl = `${baseUrl}/api/health`;
    const healthResponse = await fetch(healthUrl);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ API health accessible');
      console.log('   📊 Réponse:', JSON.stringify(healthData, null, 2));
    } else {
      console.log('   ❌ API health inaccessible');
    }
    
    // Test de l'API PDF (BL 5)
    console.log('');
    console.log('🔍 Test de l\'API PDF BL...');
    const pdfUrl = `${baseUrl}/api/pdf/delivery-note/5`;
    const pdfResponse = await fetch(pdfUrl, {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    console.log(`   Status: ${pdfResponse.status} ${pdfResponse.statusText}`);
    
    if (pdfResponse.ok) {
      const contentType = pdfResponse.headers.get('content-type');
      console.log('   ✅ API PDF accessible');
      console.log(`   📄 Content-Type: ${contentType}`);
    } else {
      console.log('   ❌ API PDF inaccessible');
      const errorText = await pdfResponse.text();
      console.log(`   📝 Erreur: ${errorText.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.log(`❌ Erreur de test: ${error.message}`);
  }
};

testDeployment().catch(console.error);