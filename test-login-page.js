/**
 * Test de la page de login en production
 */

const PRODUCTION_URL = 'https://frontend-46hwfq6hx-tigdittgolf-9191s-projects.vercel.app';

async function testLoginPage() {
  console.log('🧪 TEST PAGE LOGIN PRODUCTION');
  console.log('=============================');
  
  try {
    // Test page de login
    console.log('🔍 Test page login...');
    const response = await fetch(`${PRODUCTION_URL}/login`);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      console.log('✅ Page login accessible');
      
      const html = await response.text();
      if (html.includes('login') || html.includes('email') || html.includes('password')) {
        console.log('✅ Formulaire de connexion détecté');
      }
    } else {
      console.log(`❌ Erreur page login: ${response.status}`);
    }
    
    // Test page auth/login
    console.log('\n🔍 Test page auth/login...');
    const authResponse = await fetch(`${PRODUCTION_URL}/auth/login`);
    
    console.log(`📊 Status: ${authResponse.status}`);
    
    if (authResponse.ok) {
      console.log('✅ Page auth/login accessible');
    } else {
      console.log(`❌ Erreur auth/login: ${authResponse.status}`);
    }
    
    // Test API health
    console.log('\n🔍 Test API health...');
    const healthResponse = await fetch(`${PRODUCTION_URL}/api/health`);
    
    console.log(`📊 Status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ API health accessible');
      console.log(`📊 Données:`, healthData);
    } else {
      console.log(`❌ Erreur API health: ${healthResponse.status}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testLoginPage();