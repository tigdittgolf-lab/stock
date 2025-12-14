// Script pour vider le cache mémoire via l'API
async function clearMemoryCache() {
  console.log('🧹 VIDAGE DU CACHE MÉMOIRE');
  console.log('==========================\n');
  
  try {
    const response = await fetch('http://localhost:3005/api/cache', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Cache vidé avec succès:', result);
    } else {
      console.error('❌ Erreur vidage cache:', result);
    }
    
    // Tester l'API articles après vidage
    console.log('\n🔍 Test API articles après vidage...');
    
    const articlesResponse = await fetch('http://localhost:3005/api/articles', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const articlesData = await articlesResponse.json();
    
    console.log(`📊 Articles trouvés: ${articlesData.data?.length || 0}`);
    
    if (articlesData.data?.length === 0) {
      console.log('🎉 SUCCÈS ! L\'API retourne maintenant 0 articles');
    } else {
      console.log('❌ PROBLÈME ! L\'API retourne encore des articles:');
      console.log(JSON.stringify(articlesData, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

clearMemoryCache();