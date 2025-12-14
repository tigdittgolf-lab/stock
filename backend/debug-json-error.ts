// Script pour déboguer l'erreur JSON en inspectant les réponses caractère par caractère
async function debugJSONError() {
  console.log('🔍 DEBUG ERREUR JSON - INSPECTION DÉTAILLÉE');
  console.log('============================================\n');
  
  const baseUrl = 'http://localhost:3005';
  const headers = { 'X-Tenant': '2025_bu01' };
  
  const endpoints = [
    '/api/articles',
    '/api/clients', 
    '/api/suppliers',
    '/api/sales/articles',
    '/api/sales/clients',
    '/api/sales/suppliers',
    '/api/families',
    '/api/conversations/unread-count',
    '/api/notifications/unread-count'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 INSPECTION: ${endpoint}`);
      console.log('─'.repeat(50));
      
      const response = await fetch(`${baseUrl}${endpoint}`, { headers });
      const text = await response.text();
      
      console.log(`Status: ${response.status}`);
      console.log(`Content-Type: ${response.headers.get('content-type')}`);
      console.log(`Content-Length: ${text.length}`);
      
      // Afficher les premiers et derniers caractères
      console.log(`First 10 chars: "${text.substring(0, 10)}"`);
      console.log(`Last 10 chars: "${text.substring(text.length - 10)}"`);
      
      // Afficher les codes ASCII des premiers caractères
      console.log('First 10 char codes:', Array.from(text.substring(0, 10)).map(c => c.charCodeAt(0)));
      
      // Tenter de parser le JSON
      try {
        const json = JSON.parse(text);
        console.log('✅ JSON valide');
        
        // Vérifier s'il y a des caractères après le JSON
        const jsonString = JSON.stringify(json);
        if (text.length > jsonString.length) {
          console.log(`⚠️  ATTENTION: ${text.length - jsonString.length} caractères supplémentaires après le JSON`);
          console.log(`Caractères supplémentaires: "${text.substring(jsonString.length)}"`);
          console.log('Codes ASCII:', Array.from(text.substring(jsonString.length)).map(c => c.charCodeAt(0)));
        }
        
      } catch (jsonError) {
        console.log(`❌ JSON INVALIDE: ${jsonError.message}`);
        console.log(`Position de l'erreur: ${jsonError.message.match(/position (\d+)/)?.[1] || 'inconnue'}`);
        
        // Afficher le contexte autour de l'erreur
        const pos = parseInt(jsonError.message.match(/position (\d+)/)?.[1] || '0');
        const start = Math.max(0, pos - 5);
        const end = Math.min(text.length, pos + 5);
        console.log(`Contexte (pos ${start}-${end}): "${text.substring(start, end)}"`);
        console.log('Codes ASCII:', Array.from(text.substring(start, end)).map(c => c.charCodeAt(0)));
      }
      
    } catch (error) {
      console.log(`❌ Erreur requête: ${error.message}`);
    }
  }
  
  console.log('\n🎯 RECHERCHEZ:');
  console.log('- Les APIs marquées "❌ JSON INVALIDE"');
  console.log('- Les APIs avec "caractères supplémentaires"');
  console.log('- Les codes ASCII anormaux (< 32 ou > 126)');
}

debugJSONError();