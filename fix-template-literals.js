// Script pour corriger les template literals malformés
const fs = require('fs');
const path = require('path');

// Fonction pour corriger un fichier
function fixTemplateLiterals(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Corriger les fetch avec template literals malformés
    const patterns = [
      // Pattern 1: fetch('${window.location.origin}/api/...
      {
        old: /fetch\('(\$\{window\.location\.origin\}\/api\/[^']+)'/g,
        new: (match, p1) => `fetch(\`${p1.replace('${window.location.origin}', '${window.location.origin}')}\``
      },
      // Pattern 2: fetch(`${window.location.origin}/api/... (déjà correct)
      // Pattern 3: Corriger les guillemets simples en backticks pour template literals
      {
        old: /fetch\('(\$\{[^}]+\}[^']+)'/g,
        new: (match, p1) => `fetch(\`${p1}\``
      }
    ];

    patterns.forEach(pattern => {
      if (content.match(pattern.old)) {
        content = content.replace(pattern.old, pattern.new);
        modified = true;
      }
    });

    // Sauvegarder si modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed template literals in ${filePath}`);
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

console.log('🔧 Fixing template literals...');

// Parcourir tout le dossier frontend/app
walkDir('frontend/app', fixTemplateLiterals);

console.log('✅ Done!');