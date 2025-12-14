// Intercepter et analyser toutes les réponses pour trouver la corruption JSON
// Exécuter avec: bun run intercept-responses.ts

import { createServer } from 'http';

const BACKEND_URL = 'http://localhost:3005';
const PROXY_PORT = 3006;

const server = createServer(async (req, res) => {
  console.log(`📡 ${req.method} ${req.url}`);
  
  // Construire l'URL complète vers le backend
  const targetUrl = `${BACKEND_URL}${req.url}`;
  
  try {
    // Copier les headers
    const headers = { ...req.headers };
    delete headers.host; // Supprimer le header host pour éviter les conflits
    
    // Faire la requête vers le backend
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers as any,
      body: req.method !== 'GET' && req.method !== 'HEAD' ? await getRequestBody(req) : undefined
    });
    
    // Lire la réponse complète
    const responseText = await response.text();
    
    // Analyser la réponse
    console.log(`   Status: ${response.status}`);
    console.log(`   Content-Type: ${response.headers.get('content-type')}`);
    console.log(`   Length: ${responseText.length}`);
    console.log(`   First 100 chars: "${responseText.substring(0, 100)}"`);
    
    // Vérifier s'il y a des caractères suspects
    const suspiciousChars = [];
    for (let i = 0; i < Math.min(responseText.length, 20); i++) {
      const char = responseText[i];
      const code = char.charCodeAt(0);
      if (code < 32 && code !== 10 && code !== 13 && code !== 9) {
        suspiciousChars.push({ pos: i, char: `\\x${code.toString(16)}`, code });
      }
    }
    
    if (suspiciousChars.length > 0) {
      console.log(`   ⚠️ Suspicious chars:`, suspiciousChars);
    }
    
    // Tester le parsing JSON si c'est du JSON
    if (response.headers.get('content-type')?.includes('application/json')) {
      try {
        JSON.parse(responseText);
        console.log(`   ✅ Valid JSON`);
      } catch (parseError) {
        console.log(`   ❌ JSON Error: ${parseError.message}`);
        console.log(`   🔍 Char at pos 4: "${responseText[4]}" (${responseText.charCodeAt(4)})`);
        console.log(`   🔍 First 10 chars with codes:`);
        for (let i = 0; i < Math.min(10, responseText.length); i++) {
          console.log(`     [${i}] "${responseText[i]}" (${responseText.charCodeAt(i)})`);
        }
      }
    }
    
    // Retourner la réponse au client
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    res.end(responseText);
    
  } catch (error) {
    console.error(`💥 Proxy error for ${req.url}:`, error);
    res.writeHead(500);
    res.end('Proxy Error');
  }
});

async function getRequestBody(req: any): Promise<string> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk: any) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      resolve(body);
    });
  });
}

server.listen(PROXY_PORT, () => {
  console.log(`🔍 Response interceptor running on http://localhost:${PROXY_PORT}`);
  console.log(`📡 Proxying to ${BACKEND_URL}`);
  console.log(`\n💡 Update your frontend to use http://localhost:${PROXY_PORT} instead of ${BACKEND_URL}`);
  console.log(`   This will help us see exactly what responses are being sent.\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down proxy...');
  server.close();
  process.exit(0);
});