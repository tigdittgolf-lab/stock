const fs = require('fs');
const path = require('path');

/**
 * Script pour corriger les erreurs de syntaxe créées par la migration automatique
 */

const routesDir = 'backend/src/routes';

function getAllRouteFiles() {
  const files = fs.readdirSync(routesDir);
  return files.filter(file => file.endsWith('.ts')).map(file => path.join(routesDir, file));
}

function fixSyntaxErrors(filePath) {
  console.log(`🔧 Correction de ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Corriger les erreurs dans les template literals
  const badPattern1 = /\$\{([^,}]+),\s*database_type:\s*backendDatabaseService\.getActiveDatabaseType\(\)\s*\}/g;
  if (badPattern1.test(content)) {
    content = content.replace(badPattern1, '${$1}');
    modified = true;
    console.log(`  ✅ Template literals corrigés`);
  }
  
  // 2. Corriger les virgules mal placées dans les objets JSON
  const badPattern2 = /(\w+:\s*[^,}]+)\s*,\s*database_type:\s*backendDatabaseService\.getActiveDatabaseType\(\)\s*\}/g;
  if (badPattern2.test(content)) {
    content = content.replace(badPattern2, '$1, database_type: backendDatabaseService.getActiveDatabaseType() }');
    modified = true;
    console.log(`  ✅ Virgules dans JSON corrigées`);
  }
  
  // 3. Corriger les espaces manquants avant database_type
  const badPattern3 = /(\w+:\s*[^,}]+)\s*,\s*database_type:/g;
  if (badPattern3.test(content)) {
    content = content.replace(badPattern3, '$1, database_type:');
    modified = true;
    console.log(`  ✅ Espaces corrigés`);
  }
  
  // 4. Corriger les patterns spécifiques trouvés
  content = content.replace(
    /message: `Database function not available \(\$\{dbType, database_type: backendDatabaseService\.getActiveDatabaseType\(\) \}\)\. Please check configuration\.`/g,
    'message: `Database function not available (${dbType}). Please check configuration.`, database_type: backendDatabaseService.getActiveDatabaseType()'
  );
  
  // 5. Corriger les patterns avec des espaces étranges
  content = content.replace(
    /(\w+:\s*[^,}]+)\s*,\s*database_type:\s*backendDatabaseService\.getActiveDatabaseType\(\)\s*\}/g,
    '$1, database_type: backendDatabaseService.getActiveDatabaseType() }'
  );
  
  // 6. Ajouter l'import manquant si nécessaire
  if (content.includes('backendDatabaseService.getActiveDatabaseType()') && 
      !content.includes('import { backendDatabaseService }')) {
    
    // Trouver la ligne d'import de databaseRouter
    if (content.includes('import { databaseRouter }')) {
      content = content.replace(
        /import\s*{\s*databaseRouter\s*}\s*from\s*['"][^'"]*databaseRouter\.js['"];?/,
        `import { databaseRouter } from '../services/databaseRouter.js';
import { backendDatabaseService } from '../services/databaseService.js';`
      );
      modified = true;
      console.log(`  ✅ Import backendDatabaseService ajouté`);
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Fichier ${filePath} corrigé et sauvegardé`);
  } else {
    console.log(`  ⏭️ Aucune correction nécessaire pour ${filePath}`);
  }
  
  return modified;
}

function fixAllSyntaxErrors() {
  console.log('🚀 Correction des erreurs de syntaxe...');
  
  const routeFiles = getAllRouteFiles();
  let totalFixed = 0;
  
  routeFiles.forEach(file => {
    const fixed = fixSyntaxErrors(file);
    if (fixed) totalFixed++;
  });
  
  console.log('');
  console.log('🎯 CORRECTION TERMINÉE:');
  console.log(`  📊 ${totalFixed}/${routeFiles.length} fichiers corrigés`);
  console.log('  ✅ Erreurs de syntaxe corrigées');
}

fixAllSyntaxErrors();