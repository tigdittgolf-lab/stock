const fs = require('fs');
const path = require('path');

// Fonction pour corriger les erreurs de syntaxe
function fixSyntaxErrors(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let hasChanges = false;

    // Corriger les template literals mal formés
    const fixes = [
      // Corriger les URLs avec template literals
      {
        from: /`\$\{process\.env\.NODE_ENV === 'production' \? 'https:\/\/frontend-iota-six-72\.vercel\.app' : 'http:\/\/localhost:3005'\}\/api\//g,
        to: `\${process.env.NODE_ENV === 'production' ? 'https://frontend-iota-six-72.vercel.app' : 'http://localhost:3005'}/api/`
      },
      {
        from: /`\$\{process\.env\.NODE_ENV === 'production' \? 'https:\/\/frontend-iota-six-72\.vercel\.app' : 'http:\/\/localhost:3005'\}`/g,
        to: `\${process.env.NODE_ENV === 'production' ? 'https://frontend-iota-six-72.vercel.app' : 'http://localhost:3005'}`
      },
      // Corriger les emojis dans les template literals
      {
        from: /console\.error\(`❌([^`]+)`\);/g,
        to: 'console.error(`Backend error: $1`);'
      },
      {
        from: /console\.error\('❌([^']+)'\);/g,
        to: "console.error('Backend error: $1');"
      },
      // Corriger les erreurs de template literal spécifiques
      {
        from: /`\$\{process\.env\.NODE_ENV === \\'production\\' \? \\'https:\/\/frontend-iota-six-72\.vercel\.app\\' : \\'http:\/\/localhost:3005\\'}\//g,
        to: '${process.env.NODE_ENV === \'production\' ? \'https://frontend-iota-six-72.vercel.app\' : \'http://localhost:3005\'}/'
      }
    ];

    for (const fix of fixes) {
      if (fix.from.test && fix.from.test(content)) {
        content = content.replace(fix.from, fix.to);
        hasChanges = true;
      } else if (typeof fix.from === 'string' && content.includes(fix.from)) {
        content = content.replaceAll(fix.from, fix.to);
        hasChanges = true;
      }
    }

    // Approche plus simple : remplacer par des URLs conditionnelles simples
    if (content.includes('${process.env.NODE_ENV')) {
      // Remplacer par une approche plus simple
      content = content.replace(
        /const backendUrl = `[^`]+`;/g,
        `const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://frontend-iota-six-72.vercel.app/api'
      : 'http://localhost:3005/api';`
      );
      hasChanges = true;
    }

    if (hasChanges) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Fixed syntax: ${filePath}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ Error fixing ${filePath}:`, error.message);
    return false;
  }
}

// Fonction pour parcourir et corriger tous les fichiers
function fixAllFiles(dirPath) {
  let fixedCount = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        if (item !== 'node_modules' && item !== '.next' && item !== '.git') {
          fixedCount += fixAllFiles(itemPath);
        }
      } else if (stat.isFile() && item.endsWith('.ts')) {
        if (fixSyntaxErrors(itemPath)) {
          fixedCount++;
        }
      }
    }
  } catch (error) {
    console.error(`❌ Error reading directory ${dirPath}:`, error.message);
  }
  
  return fixedCount;
}

console.log('🔧 Fixing syntax errors in API routes...');
const fixedCount = fixAllFiles('./frontend/app/api');
console.log(`🎉 Fixed ${fixedCount} files with syntax errors.`);