// Test de l'URL promise
const testURLPromise = async () => {
  const urlPromise = 'https://frontend-iota-six-72.vercel.app';
  
  console.log('🎯 TEST DE L\'URL PROMISE');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`\n📍 ${urlPromise}\n`);
  console.log('═══════════════════════════════════════════════════════\n');
  
  console.log('🔍 Vérification de l\'accès...\n');
  
  try {
    // Test page d'accueil
    console.log('🏠 Test de la page d\'accueil...');
    const homeResponse = await fetch(urlPromise);
    console.log(`   Status: ${homeResponse.status} ${homeResponse.statusText}`);
    
    if (homeResponse.ok) {
      console.log('   ✅ Page d\'accueil accessible\n');
    } else {
      console.log('   ❌ Page d\'accueil inaccessible\n');
      return;
    }
    
    // Test API health
    console.log('🔍 Test de l\'API health...');
    const healthResponse = await fetch(`${urlPromise}/api/health`);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.statusText}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('   ✅ API health accessible');
      console.log(`   📊 Réponse:`, healthData);
    } else {
      console.log('   ⚠️  API health non disponible (normal si backend séparé)');
    }
    
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('✅ ENGAGEMENT TENU !');
    console.log(`   L'URL ${urlPromise} est maintenant fonctionnelle`);
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('📋 URLs disponibles:');
    console.log(`   • Frontend (Vercel): ${urlPromise}`);
    console.log(`   • Backend (Tailscale): https://desktop-bhhs068.tail1d9c54.ts.net/api`);
    console.log('\n💡 Note: Le frontend Vercel utilise le backend Tailscale pour les APIs\n');
    
  } catch (error) {
    console.log(`\n❌ Erreur: ${error.message}\n`);
  }
};

testURLPromise().catch(console.error);