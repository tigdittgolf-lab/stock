// Debug pour identifier l'erreur JSON exacte
// Exécuter avec: bun run debug-json-error.ts

async function debugJSONError() {
  console.log('🔍 Debugging JSON error...\n');

  const baseUrl = 'http://localhost:3005';
  const headers = {
    'Content-Type': 'application/json',
    'X-Tenant': '2025_bu01'
  };

  try {
    // Test tous les endpoints utilisés par la page de création de client
    const endpoints = [
      '/api/sales/clients',
      '/api/sales/suppliers',
      '/api/settings/families',
      '/api/sales/clients/CLI001'
    ];

    for (const endpoint of endpoints) {
      console.log(`📡 Testing: ${endpoint}`);
      
      try {
        const response = await fetch(`${baseUrl}${endpoint}`, { headers });
        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);
        
        const text = await response.text();
        console.log(`   Response length: ${text.length}`);
        console.log(`   First 50 chars: "${text.substring(0, 50)}"`);
        console.log(`   Last 50 chars: "${text.substring(text.length - 50)}"`);
        
        // Chercher des caractères suspects
        const suspiciousChars = [];
        for (let i = 0; i < Math.min(text.length, 100); i++) {
          const char = text[i];
          const code = char.charCodeAt(0);
          if (code < 32 && code !== 10 && code !== 13 && code !== 9) {
            suspiciousChars.push({ pos: i, char: char, code: code });
          }
        }
        
        if (suspiciousChars.length > 0) {
          console.log(`   ⚠️ Suspicious characters found:`, suspiciousChars);
        }
        
        // Tester le parsing JSON
        try {
          const json = JSON.parse(text);
          console.log(`   ✅ Valid JSON`);
        } catch (parseError) {
          console.log(`   ❌ JSON Parse Error: ${parseError.message}`);
          
          // Analyser l'erreur "position 4"
          if (parseError.message.includes('position 4')) {
            console.log(`   🔍 Character at position 4: "${text[4]}" (code: ${text.charCodeAt(4)})`);
            console.log(`   🔍 Characters 0-10: "${text.substring(0, 10)}"`);
            
            // Chercher des patterns suspects
            if (text.startsWith('"OK"')) {
              console.log(`   🚨 Found "OK" prefix - possible double response!`);
            }
          }
        }
        
        console.log('');
        
      } catch (fetchError) {
        console.log(`   ❌ Fetch Error: ${fetchError.message}\n`);
      }
    }

    // Test spécial: requêtes multiples simultanées (comme dans l'interface)
    console.log('🔄 Testing simultaneous requests...');
    
    const promises = [
      fetch(`${baseUrl}/api/sales/clients`, { headers }),
      fetch(`${baseUrl}/api/sales/suppliers`, { headers }),
      fetch(`${baseUrl}/api/settings/families`, { headers })
    ];

    const responses = await Promise.all(promises);
    
    for (let i = 0; i < responses.length; i++) {
      const text = await responses[i].text();
      console.log(`   Request ${i + 1}: Length ${text.length}, First 30: "${text.substring(0, 30)}"`);
      
      try {
        JSON.parse(text);
        console.log(`   Request ${i + 1}: ✅ Valid JSON`);
      } catch (e) {
        console.log(`   Request ${i + 1}: ❌ ${e.message}`);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

debugJSONError();