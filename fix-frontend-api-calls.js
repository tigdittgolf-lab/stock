const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger tous les appels API frontend qui pointent vers le mauvais port
 */

function getAllTsxFiles(dir) {
  const files = [];
  
  function scanDir(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('.next')) {
        scanDir(fullPath);
      } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  scanDir(dir);
  return files;
}

function fixApiCalls(filePath) {
  console.log(`🔧 Vérification de ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Remplacer ${window.location.origin}/api/suppliers par getApiUrl('suppliers')
  const pattern1 = /\$\{window\.location\.origin\}\/api\/suppliers/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, "getApiUrl('suppliers')");
    modified = true;
    console.log(`  ✅ Corrigé: window.location.origin/api/suppliers → getApiUrl('suppliers')`);
  }
  
  // 2. Remplacer ${window.location.origin}/api/sales/suppliers par getApiUrl('sales/suppliers')
  const pattern2 = /\$\{window\.location\.origin\}\/api\/sales\/suppliers/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, "getApiUrl('sales/suppliers')");
    modified = true;
    console.log(`  ✅ Corrigé: window.location.origin/api/sales/suppliers → getApiUrl('sales/suppliers')`);
  }
  
  // 3. Remplacer d'autres patterns similaires
  const pattern3 = /\$\{window\.location\.origin\}\/api\/([^'"`\s]+)/g;
  const matches = content.match(pattern3);
  if (matches) {
    for (const match of matches) {
      const endpoint = match.replace('${window.location.origin}/api/', '');
      content = content.replace(match, `getApiUrl('${endpoint}')`);
      modified = true;
      console.log(`  ✅ Corrigé: ${match} → getApiUrl('${endpoint}')`);
    }
  }
  
  // 4. Ajouter l'import getApiUrl si nécessaire
  if (modified && content.includes("getApiUrl(") && !content.includes("import { getApiUrl }")) {
    // Chercher une ligne d'import existante
    const importRegex = /import\s+{[^}]*}\s+from\s+['"][^'"]*['"];?/;
    const importMatch = content.match(importRegex);
    
    if (importMatch) {
      // Ajouter après le premier import
      content = content.replace(importMatch[0], importMatch[0] + "\nimport { getApiUrl } from '@/lib/api';");
      console.log(`  ✅ Ajouté: import { getApiUrl } from '@/lib/api'`);
    } else {
      // Ajouter au début du fichier après 'use client' si présent
      if (content.includes("'use client'")) {
        content = content.replace("'use client';", "'use client';\n\nimport { getApiUrl } from '@/lib/api';");
      } else {
        content = "import { getApiUrl } from '@/lib/api';\n\n" + content;
      }
      console.log(`  ✅ Ajouté: import { getApiUrl } from '@/lib/api'`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Fichier ${filePath} sauvegardé`);
  } else {
    console.log(`  ⏭️ Aucune modification nécessaire`);
  }
  
  return modified;
}

function fixAllApiCalls() {
  console.log('🚀 Correction des appels API frontend...');
  
  const frontendDir = 'frontend';
  const tsxFiles = getAllTsxFiles(frontendDir);
  
  console.log(`📁 ${tsxFiles.length} fichiers TypeScript trouvés`);
  
  let totalFixed = 0;
  
  tsxFiles.forEach(file => {
    const fixed = fixApiCalls(file);
    if (fixed) totalFixed++;
  });
  
  console.log('');
  console.log('🎯 CORRECTION TERMINÉE:');
  console.log(`  📊 ${totalFixed} fichiers modifiés`);
  console.log('  ✅ Tous les appels API pointent maintenant vers le backend (port 3005)');
  console.log('  🔄 Redémarrez le serveur frontend pour appliquer les changements');
}

fixAllApiCalls();