const fs = require('fs');
const path = require('path');

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let updatedContent = content;
    let hasChanges = false;

    // Remplacer les URLs localhost par des URLs conditionnelles pour production
    const replacements = [
      // Configuration conditionnelle correcte
      {
        from: /const\s+(?:API_BASE_URL|BACKEND_URL)\s*=\s*process\.env\.NODE_ENV\s*===\s*['"]production['"][^}]+\?[^:]+:\s*['"]http:\/\/localhost:3005\/api['"];?/g,
        to: `const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://frontend-iota-six-72.vercel.app/api'
  : 'http://localhost:3005/api';`
      },
      // URLs hardcodées à remplacer par des conditionnelles
      {
        from: "'http://localhost:3005/api/",
        to: "`\${process.env.NODE_ENV === 'production' ? 'https://frontend-iota-six-72.vercel.app' : 'http://localhost:3005'}/api/"
      },
      {
        from: '"http://localhost:3005/api/',
        to: '`${process.env.NODE_ENV === \'production\' ? \'https://frontend-iota-six-72.vercel.app\' : \'http://localhost:3005\'}/api/'
      },
      {
        from: "`http://localhost:3005/api/",
        to: "`\${process.env.NODE_ENV === 'production' ? 'https://frontend-iota-six-72.vercel.app' : 'http://localhost:3005'}/api/"
      },
      // URLs sans /api
      {
        from: "'http://localhost:3005'",
        to: "`\${process.env.NODE_ENV === 'production' ? 'https://frontend-iota-six-72.vercel.app' : 'http://localhost:3005'}`"
      },
      {
        from: '"http://localhost:3005"',
        to: '`${process.env.NODE_ENV === \'production\' ? \'https://frontend-iota-six-72.vercel.app\' : \'http://localhost:3005\'}`'
      }
    ];

    for (const replacement of replacements) {
      if (typeof replacement.from === 'string') {
        if (updatedContent.includes(replacement.from)) {
          updatedContent = updatedContent.replaceAll(replacement.from, replacement.to);
          hasChanges = true;
        }
      } else {
        // Regex replacement
        if (replacement.from.test(updatedContent)) {
          updatedContent = updatedContent.replace(replacement.from, replacement.to);
          hasChanges = true;
        }
      }
    }
    
    if (hasChanges) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Fixed: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir récursivement un dossier
function processDirectory(dirPath) {
  let updatedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        // Ignorer node_modules et .next
        if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
          updatedCount += processDirectory(itemPath);
        }
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx'))) {
        if (processFile(itemPath)) {
          updatedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
  }
  
  return updatedCount;
}

// Traiter le dossier frontend/app/api
console.log('🔄 Fixing production API URLs...');
console.log('📍 Making URLs conditional: localhost for dev, production for prod');
console.log('');

const updatedCount = processDirectory('./frontend/app/api');

console.log('');
console.log(`🎉 Completed! Fixed ${updatedCount} files.`);

if (updatedCount > 0) {
  console.log('');
  console.log('✅ APIs will now work in both development and production');
  console.log('🔄 Development: localhost:3005');
  console.log('🌐 Production: frontend-iota-six-72.vercel.app');
}