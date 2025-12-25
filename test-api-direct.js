/**
 * Test direct des APIs en production
 */

const PRODUCTION_URL = 'https://frontend-46hwfq6hx-tigdittgolf-9191s-projects.vercel.app';

async function testAPIDirect() {
  console.log('🧪 TEST DIRECT API PRODUCTION');
  console.log('=============================');
  
  try {
    // Test API Articles avec headers complets
    console.log('🔍 Test API Articles...');
    const response = await fetch(`${PRODUCTION_URL}/api/sales/articles`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01',
        'User-Agent': 'Test-Script/1.0'
      }
    });
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Articles fonctionne !');
      console.log(`📊 Réponse:`, data);
    } else {
      const errorText = await response.text();
      console.log(`❌ Erreur API: ${response.status}`);
      console.log(`📄 Contenu:`, errorText.substring(0, 500));
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testAPIDirect();