/**
 * Test simple de l'application en production
 */

const PRODUCTION_URL = 'https://frontend-46hwfq6hx-tigdittgolf-9191s-projects.vercel.app';

async function testSimple() {
  console.log('🧪 TEST SIMPLE PRODUCTION');
  console.log('=========================');
  
  try {
    // Test page d'accueil
    console.log('🔍 Test accessibilité...');
    const response = await fetch(PRODUCTION_URL);
    
    console.log(`📊 Status: ${response.status}`);
    console.log(`📋 Headers: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const html = await response.text();
      const hasTitle = html.includes('<title>');
      const hasReact = html.includes('__NEXT_DATA__');
      
      console.log('✅ Application accessible');
      console.log(`📄 HTML valide: ${hasTitle ? 'Oui' : 'Non'}`);
      console.log(`⚛️  Next.js détecté: ${hasReact ? 'Oui' : 'Non'}`);
      
      // Vérifier si c'est une page de login ou d'accueil
      if (html.includes('login') || html.includes('connexion')) {
        console.log('🔐 Page de connexion détectée');
      } else if (html.includes('dashboard') || html.includes('tableau')) {
        console.log('📊 Dashboard détecté');
      }
      
    } else {
      console.log(`❌ Erreur: ${response.status} ${response.statusText}`);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testSimple();