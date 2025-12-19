const fs = require('fs');
const path = require('path');

// Fichiers à corriger
const files = [
  'frontend/app/admin/page.tsx',
  'frontend/app/admin/users/page.tsx', 
  'frontend/app/admin/business-units/page.tsx'
];

files.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remplacer tous les template literals mal formés
    content = content.replace(/'(\$\{window\.location\.origin\}[^']*?)'/g, '`$1`');
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Corrigé: ${filePath}`);
  } else {
    console.log(`❌ Fichier non trouvé: ${filePath}`);
  }
});

console.log('🎯 Correction des template literals terminée');