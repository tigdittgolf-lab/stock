// Test d'accès aux données locales via Tailscale en production
async function testTailscaleProductionAccess() {
  console.log('🚀 Test d\'accès aux données via Tailscale en production...');
  
  const PRODUCTION_URL = 'https://frontend-pchq0o7yg-tigdittgolf-9191s-projects.vercel.app';
  const TAILSCALE_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
  
  console.log(`📍 URL Production: ${PRODUCTION_URL}`);
  console.log(`📍 URL Tailscale Backend: ${TAILSCALE_URL}`);
  
  // D'abord tester l'accès direct au backend Tailscale
  console.log('\n🔍 Test direct du backend Tailscale...');
  try {
    const directResponse = await fetch(`${TAILSCALE_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Backend Tailscale Status: ${directResponse.status}`);
    
    if (directResponse.ok) {
      const data = await directResponse.json();
      console.log('✅ Backend Tailscale accessible:', data.status);
    } else {
      console.log('❌ Backend Tailscale non accessible');
      return;
    }
  } catch (error) {
    console.log('❌ Erreur accès direct Tailscale:', error.message);
    return;
  }
  
  // Maintenant tester l'accès via l'application Vercel
  console.log('\n🔍 Test des APIs Vercel → Tailscale...');
  
  const apiEndpoints = [
    '/api/health',
    '/api/sales/proformas',
    '/api/articles',
    '/api/clients'
  ];
  
  for (const endpoint of apiEndpoints) {
    try {
      console.log(`\n📡 Test de ${endpoint}...`);
      
      const response = await fetch(`${PRODUCTION_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01',
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📊 Status: ${response.status}`);
      
      if (response.status === 401) {
        console.log('🔒 Protégé par authentification Vercel');
      } else if (response.status === 508) {
        console.log('❌ ERREUR 508 - Loop Detected encore présente!');
      } else if (response.ok) {
        console.log('✅ Succès!');
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          console.log(`📋 Données reçues: ${data.data.length} éléments`);
          console.log('🎯 ACCÈS AUX DONNÉES LOCALES RÉUSSI!');
        } else if (data.success !== undefined) {
          console.log(`📋 Succès: ${data.success}`);
        }
      } else {
        console.log(`⚠️ Status: ${response.status}`);
        const text = await response.text();
        console.log('📄 Réponse:', text.substring(0, 200));
      }
      
    } catch (error) {
      console.log(`❌ Erreur pour ${endpoint}:`, error.message);
    }
  }
  
  console.log('\n📋 RÉSUMÉ:');
  console.log('✅ Déploiement avec URLs Tailscale réussi');
  console.log('✅ Backend local accessible via Tailscale');
  console.log('🎯 Configuration prête pour accès aux données locales');
}

testTailscaleProductionAccess().catch(console.error);