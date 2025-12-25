const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
  // Ajouter les headers CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Tenant');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Servir le fichier HTML de test
  if (req.url === '/' || req.url === '/index.html') {
    fs.readFile('test-simple-app.html', 'utf8', (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erreur serveur');
        return;
      }
      
      res.setHeader('Content-Type', 'text/html');
      res.writeHead(200);
      res.end(data);
    });
  } else {
    res.writeHead(404);
    res.end('Page non trouvée');
  }
});

const PORT = 8080;
server.listen(PORT, () => {
  console.log(`🌐 Serveur de test démarré sur http://localhost:${PORT}`);
  console.log('📋 Ouvrez cette URL dans votre navigateur pour tester');
  console.log('🔗 Backend tunnel: https://enabled-encourage-mechanics-performance.trycloudflare.com');
});