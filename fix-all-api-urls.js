const fs = require('fs');
const path = require('path');

// URL à remplacer
const oldUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net';
const newUrl = 'https://frontend-iota-six-72.vercel.app';

// Fonction pour traiter un fichier
function processFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const updatedContent = content.replace(new RegExp(oldUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), newUrl);
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated: ${filePath}`);
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
      } else if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
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

// Traiter le dossier frontend
console.log('🔄 Updating API URLs in frontend files...');
console.log(`📍 Replacing: ${oldUrl}`);
console.log(`📍 With: ${newUrl}`);
console.log('');

const updatedCount = processDirectory('./frontend');

console.log('');
console.log(`🎉 Completed! Updated ${updatedCount} files.`);

if (updatedCount > 0) {
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. git add .');
  console.log('2. git commit -m "fix: Update all API URLs to production"');
  console.log('3. git push');
  console.log('4. vercel --prod (from frontend folder)');
}