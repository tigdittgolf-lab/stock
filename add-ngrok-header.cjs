const fs = require('fs');
const path = require('path');

// Fonction pour ajouter le header ngrok
function addNgrokHeader(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Ajouter le header ngrok-skip-browser-warning à tous les fetch
  content = content.replace(
    /'Content-Type': 'application\/json'/g,
    "'Content-Type': 'application/json',\n        'ngrok-skip-browser-warning': 'true'"
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ Updated: ${filePath}`);
}

// Parcourir tous les fichiers API
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (file === 'route.ts') {
      addNgrokHeader(filePath);
    }
  });
}

// Démarrer depuis frontend/app/api
processDirectory('./frontend/app/api');
console.log('\n🎉 Tous les fichiers ont été mis à jour!');
