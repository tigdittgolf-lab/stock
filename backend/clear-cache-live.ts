// Script pour vider le cache du serveur en cours d'exécution
const clearCacheLive = async () => {
  console.log('🧹 VIDAGE DU CACHE EN DIRECT');
  console.log('============================\n');
  
  try {
    // 1. Vérifier l'état actuel du cache
    console.log('🔍 État actuel du cache...');
    
    const statusResponse = await fetch('http://localhost:3005/api/cache/status', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (statusResponse.ok) {
      const statusData = await statusResponse.json();
      console.log('📊 Cache actuel:');
      console.log(`   Nom: ${statusData.companyInfo.name}`);
      console.log(`   Adresse: ${statusData.companyInfo.address}`);
      console.log(`   Téléphone: ${statusData.companyInfo.phone}`);
    } else {
      console.log('⚠️ Impossible de lire le cache actuel');
      console.log('   → Le serveur doit être redémarré pour ajouter l\'endpoint /api/cache');
      console.log('   → Ou utilisez Ctrl+C puis "bun run index.ts"');
      return;
    }
    
    // 2. Vider et rafraîchir le cache
    console.log('\n🔄 Rafraîchissement du cache...');
    
    const refreshResponse = await fetch('http://localhost:3005/api/cache/refresh', {
      method: 'POST',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json();
      console.log('✅ Cache rafraîchi avec succès !');
      console.log('📊 Nouvelles données:');
      console.log(`   Nom: ${refreshData.companyInfo.name}`);
      console.log(`   Adresse: ${refreshData.companyInfo.address}`);
      console.log(`   Téléphone: ${refreshData.companyInfo.phone}`);
      console.log(`   Email: ${refreshData.companyInfo.email}`);
    } else {
      console.log('❌ Erreur lors du rafraîchissement');
    }
    
    // 3. Tester un PDF pour confirmer
    console.log('\n📄 Test PDF avec les nouvelles données...');
    
    const pdfResponse = await fetch('http://localhost:3005/api/pdf/delivery-note/4', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (pdfResponse.ok) {
      console.log('✅ PDF généré avec les nouvelles données !');
      console.log(`   Taille: ${pdfResponse.headers.get('content-length')} bytes`);
    } else {
      console.log(`⚠️ Erreur PDF: ${pdfResponse.status}`);
    }
    
    console.log('\n🎉 CACHE VIDÉ AVEC SUCCÈS !');
    console.log('===========================');
    console.log('Maintenant, actualisez votre page de bon de livraison');
    console.log('pour voir les nouvelles données d\'entreprise !');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 SOLUTION ALTERNATIVE');
    console.log('=======================');
    console.log('Si cette méthode ne fonctionne pas:');
    console.log('1. Arrêtez le serveur backend (Ctrl+C)');
    console.log('2. Relancez: bun run index.ts');
    console.log('3. Actualisez votre page frontend');
  }
};

clearCacheLive();