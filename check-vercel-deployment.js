// Vérifier le statut du déploiement Vercel
async function checkVercelDeployment() {
  try {
    console.log('🔍 Vérification du déploiement Vercel...');
    
    // Tester l'URL de production actuelle
    const productionUrl = 'https://frontend-iota-six-72.vercel.app';
    
    console.log(`📡 Test de l'URL de production: ${productionUrl}`);
    
    const response = await fetch(`${productionUrl}/api/auth/exercises`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status de la réponse:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ API accessible, données reçues:');
      console.log(JSON.stringify(data, null, 2));
      
      // Vérifier si BU02 est disponible
      const hasBU02 = data.data && data.data.some(item => item.schema_name === '2025_bu02');
      
      if (hasBU02) {
        console.log('🎉 DÉPLOIEMENT RÉUSSI ! BU02 est disponible en production');
        console.log('✅ Votre ami peut maintenant sélectionner le tenant BU02');
      } else {
        console.log('⚠️ BU02 pas encore disponible, déploiement en cours...');
        console.log('📋 Tenants disponibles:', data.data?.map(d => d.schema_name));
      }
    } else {
      console.log('❌ Erreur API:', response.status);
      const text = await response.text();
      console.log('Réponse:', text.substring(0, 200));
    }
    
    // Tester aussi l'URL alternative
    console.log('\n🔍 Test de l\'URL alternative...');
    const altUrl = 'https://frontend-qd42ozf8q-tigdittgolf-9191s-projects.vercel.app';
    
    try {
      const altResponse = await fetch(`${altUrl}/api/auth/exercises`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status URL alternative:', altResponse.status);
      
      if (altResponse.status === 200) {
        const altData = await altResponse.json();
        const hasAltBU02 = altData.data && altData.data.some(item => item.schema_name === '2025_bu02');
        
        if (hasAltBU02) {
          console.log('🎉 BU02 disponible sur l\'URL alternative aussi !');
        } else {
          console.log('⚠️ BU02 pas encore sur l\'URL alternative');
        }
      }
    } catch (altError) {
      console.log('⚠️ URL alternative non accessible:', altError.message);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  }
}

checkVercelDeployment();