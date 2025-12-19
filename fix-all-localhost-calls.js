// Script pour corriger TOUS les appels localhost:3005
const fs = require('fs');
const path = require('path');

// Fonction pour corriger un fichier
function fixAllApiCalls(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remplacer TOUS les appels localhost:3005 par window.location.origin
    const oldPattern = /http:\/\/localhost:3005/g;
    const newPattern = '${window.location.origin}';

    if (content.match(oldPattern)) {
      content = content.replace(oldPattern, newPattern);
      modified = true;
      console.log(`✅ Fixed localhost:3005 calls in ${filePath}`);
    }

    // Sauvegarder si modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`💾 Saved ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Fonction pour parcourir récursivement les dossiers
function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      callback(filePath);
    }
  });
}

console.log('🔧 Fixing ALL localhost:3005 calls in frontend...');

// Parcourir tout le dossier frontend/app
walkDir('frontend/app', fixAllApiCalls);

console.log('✅ Done! All localhost:3005 calls have been fixed.');