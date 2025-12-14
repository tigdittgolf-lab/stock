// Script pour tester toutes les APIs et identifier les erreurs JSON
async function testAllAPIs() {
  console.log('🧪 TEST DE TOUTES LES APIs');
  console.log('==========================\n');
  
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
    '/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔍 Testing: ${endpoint}`);
      
      const response = await fetch(`${baseUrl}${endpoint}`, { headers });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers.get('content-type')}`);
      
      const text = await response.text();
      console.log(`   Raw response: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
      
      try {
        const json = JSON.parse(text);
        console.log(`   ✅ Valid JSON: ${JSON.stringify(json).substring(0, 50)}...`);
      } catch (jsonError) {
        console.log(`   ❌ Invalid JSON: ${jsonError.message}`);
        console.log(`   Raw text: "${text}"`);
      }
      
    } catch (error) {
      console.log(`   ❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n🎯 RÉSUMÉ:');
  console.log('Vérifiez les APIs marquées "❌ Invalid JSON"');
}

testAllAPIs();