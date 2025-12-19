const fs = require('fs');

// Lire le fichier settings
let content = fs.readFileSync('frontend/app/settings/page.tsx', 'utf8');

// Remplacer tous les fetch avec guillemets simples par des backticks
content = content.replace(/fetch\('(\$\{window\.location\.origin\}[^']+)'/g, 'fetch(`$1`');

// Sauvegarder
fs.writeFileSync('frontend/app/settings/page.tsx', content);

console.log('✅ Fixed settings page template literals');