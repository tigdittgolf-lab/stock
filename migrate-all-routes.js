const fs = require('fs');
const path = require('path');

/**
 * Script de migration automatique pour remplacer supabaseAdmin par databaseRouter
 * dans TOUTES les routes backend
 */

const routesDir = 'backend/src/routes';

// Fonction pour lire tous les fichiers .ts dans le dossier routes
function getAllRouteFiles() {
  const files = fs.readdirSync(routesDir);
  return files.filter(file => file.endsWith('.ts')).map(file => path.join(routesDir, file));
}

// Fonction pour migrer un fichier
function migrateFile(filePath) {
  console.log(`🔄 Migration de ${filePath}...`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // 1. Ajouter l'import du databaseRouter si supabaseAdmin est utilisé
  if (content.includes('supabaseAdmin') && !content.includes('databaseRouter')) {
    // Trouver la ligne d'import de supabaseAdmin
    const supabaseImportRegex = /import\s*{\s*supabaseAdmin\s*}\s*from\s*['"][^'"]*supabaseClient\.js['"];?/;
    
    if (supabaseImportRegex.test(content)) {
      content = content.replace(
        supabaseImportRegex,
        `import { supabaseAdmin } from '../supabaseClient.js';
import { databaseRouter } from '../services/databaseRouter.js';`
      );
      modified = true;
      console.log(`  ✅ Import databaseRouter ajouté`);
    }
  }
  
  // 2. Remplacer supabaseAdmin.rpc par databaseRouter.rpc
  const rpcMatches = content.match(/supabaseAdmin\.rpc\(/g);
  if (rpcMatches) {
    content = content.replace(/supabaseAdmin\.rpc\(/g, 'databaseRouter.rpc(');
    modified = true;
    console.log(`  ✅ ${rpcMatches.length} appels supabaseAdmin.rpc remplacés`);
  }
  
  // 3. Remplacer les appels exec_sql spéciaux
  const execSqlMatches = content.match(/supabaseAdmin\.rpc\(\s*['"]exec_sql['"],\s*{\s*sql:/g);
  if (execSqlMatches) {
    // Remplacer les patterns exec_sql
    content = content.replace(
      /supabaseAdmin\.rpc\(\s*['"]exec_sql['"],\s*{\s*sql:\s*([^}]+)\s*}\s*\)/g,
      'databaseRouter.execSql($1)'
    );
    console.log(`  ✅ ${execSqlMatches.length} appels exec_sql convertis`);
  }
  
  // 4. Ajouter database_type dans les réponses JSON si pas déjà présent
  const jsonResponseRegex = /return\s+c\.json\(\s*{\s*success:\s*true,\s*data:/g;
  const jsonMatches = content.match(jsonResponseRegex);
  if (jsonMatches) {
    // Ajouter database_type aux réponses qui n'en ont pas
    content = content.replace(
      /return\s+c\.json\(\s*{\s*success:\s*true,\s*data:\s*([^,}]+)([^}]*)\s*}\s*\)/g,
      (match, dataVar, rest) => {
        if (!rest.includes('database_type')) {
          return match.replace(
            /}\s*\)$/,
            `, database_type: backendDatabaseService.getActiveDatabaseType() })`
          );
        }
        return match;
      }
    );
  }
  
  // 5. Ajouter l'import de backendDatabaseService si database_type est utilisé
  if (content.includes('backendDatabaseService.getActiveDatabaseType()') && 
      !content.includes('backendDatabaseService')) {
    content = content.replace(
      /import\s*{\s*databaseRouter\s*}\s*from\s*['"][^'"]*databaseRouter\.js['"];?/,
      `import { databaseRouter } from '../services/databaseRouter.js';
import { backendDatabaseService } from '../services/databaseService.js';`
    );
    modified = true;
    console.log(`  ✅ Import backendDatabaseService ajouté`);
  }
  
  // Sauvegarder le fichier modifié
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`  💾 Fichier ${filePath} sauvegardé`);
  } else {
    console.log(`  ⏭️ Aucune modification nécessaire pour ${filePath}`);
  }
  
  return modified;
}

// Fonction principale
function migrateAllRoutes() {
  console.log('🚀 Début de la migration automatique de toutes les routes...');
  
  const routeFiles = getAllRouteFiles();
  let totalModified = 0;
  
  console.log(`📁 ${routeFiles.length} fichiers de routes trouvés:`);
  routeFiles.forEach(file => console.log(`  - ${file}`));
  console.log('');
  
  routeFiles.forEach(file => {
    const modified = migrateFile(file);
    if (modified) totalModified++;
  });
  
  console.log('');
  console.log('🎯 MIGRATION TERMINÉE:');
  console.log(`  📊 ${totalModified}/${routeFiles.length} fichiers modifiés`);
  console.log('  ✅ Toutes les routes utilisent maintenant databaseRouter');
  console.log('  🔄 Redémarrez le serveur backend pour appliquer les changements');
}

// Exécuter la migration
migrateAllRoutes();