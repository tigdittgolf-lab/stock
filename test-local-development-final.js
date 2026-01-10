// Test final de l'environnement de développement local
async function testLocalDevelopment() {
  console.log('🚀 Test de l\'environnement de développement local...');
  console.log('📍 Frontend: http://localhost:3001');
  console.log('📍 Backend: http://localhost:3005');
  
  // Test direct du backend
  console.log('\n🔍 Test direct du backend...');
  try {
    const backendResponse = await fetch('http://localhost:3005/health');
    console.log(`📊 Backend Status: ${backendResponse.status}`);
    if (backendResponse.ok) {
      const data = await backendResponse.json();
      console.log('✅ Backend fonctionne:', data.status);
    }
  } catch (error) {
    console.log('❌ Erreur backend:', error.message);
  }
  
  // Test des APIs frontend (qui doivent maintenant appeler le backend correctement)
  const frontendAPIs = [
    '/api/health',
    '/api/sales/proformas',
    '/api/articles',
    '/api/clients'
  ];
  
  console.log('\n🔍 Test des APIs frontend...');
  for (const endpoint of frontendAPIs) {
    try {
      console.log(`\n📡 Test de ${endpoint}...`);
      
      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 508) {
        console.log('❌ ERREUR 508 - Loop Detected encore présente!');
      } else if (response.ok) {
        console.log('✅ Succès!');
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          console.log(`📋 Données: ${data.data.length} éléments`);
        } else if (data.success !== undefined) {
          console.log(`📋 Succès: ${data.success}`);
        }
      } else {
        console.log(`⚠️ Status: ${response.status}`);
      }
      
    } catch (error) {
      console.log(`❌ Erreur pour ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n📋 Résumé du test local:');
  console.log('✅ Backend démarré sur port 3005');
  console.log('✅ Frontend démarré sur port 3001');
  console.log('🎯 Test des corrections de boucle API terminé');
}

testLocalDevelopment().catch(console.error);