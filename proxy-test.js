const http = require('http');
const https = require('https');
const fs = require('fs');

const TUNNEL_URL = 'https://enabled-encourage-mechanics-performance.trycloudflare.com';

const server = http.createServer((req, res) => {
  // Headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Servir la page de test
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile('test-simple-app.html', 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erreur serveur');
        return;
      }
      
      // Remplacer l'URL du tunnel par notre proxy local
      data = data.replace(
        'https://enabled-encourage-mechanics-performance.trycloudflare.com',
        'http://localhost:8080/proxy'
      );
      
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(data);
    });
    return;
  }

  // Proxy vers le tunnel
  if (req.url.startsWith('/proxy')) {
    const targetPath = req.url.replace('/proxy', '');
    const targetUrl = TUNNEL_URL + targetPath;
    
    console.log(`🔄 Proxy: ${req.method} ${targetUrl}`);
    
    // Collecter le body de la requête
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      // Faire la requête vers le tunnel
      const options = {
        method: req.method,
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant': req.headers['x-tenant'] || '2025_bu01',
          'Authorization': req.headers['authorization'] || ''
        }
      };

      const proxyReq = https.request(targetUrl, options, (proxyRes) => {
        // Copier les headers de réponse
        Object.keys(proxyRes.headers).forEach(key => {
          res.setHeader(key, proxyRes.headers[key]);
        });
        
        res.writeHead(proxyRes.statusCode);
        
        let responseBody = '';
        proxyRes.on('data', chunk => {
          responseBody += chunk;
        });
        
        proxyRes.on('end', () => {
          console.log(`✅ Réponse: ${proxyRes.statusCode} - ${responseBody.substring(0, 100)}...`);
          res.end(responseBody);
        });
      });

      proxyReq.on('error', (err) => {
        console.error(`❌ Erreur proxy: ${err.message}`);
        res.writeHead(500);
        res.end(JSON.stringify({ 
          success: false, 
          error: `Proxy error: ${err.message}` 
        }));
      });

      if (body) {
        proxyReq.write(body);
      }
      
      proxyReq.end();
    });
    
    return;
  }

  // 404 pour autres routes
  res.writeHead(404);
  res.end('Page non trouvée');
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🌐 Serveur proxy démarré sur http://localhost:${PORT}`);
  console.log(`🔗 Proxy vers: ${TUNNEL_URL}`);
  console.log('📋 Ouvrez http://localhost:8080 dans votre navigateur');
  console.log('🔄 Toutes les requêtes seront proxifiées vers le tunnel');
});