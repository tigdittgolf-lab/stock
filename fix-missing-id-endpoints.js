const fs = require('fs');

// Corrections pour les routes avec IDs manquants
const corrections = [
  {
    file: 'frontend/app/api/pdf/delivery-note-small/[id]/route.ts',
    search: 'const response = await fetch(backendUrl, {',
    replace: 'const response = await fetch(`${backendUrl}/pdf/delivery-note-small/${validId}`, {'
  },
  {
    file: 'frontend/app/api/pdf/delivery-note-ticket/[id]/route.ts',
    search: 'const response = await fetch(backendUrl, {',
    replace: 'const response = await fetch(`${backendUrl}/pdf/delivery-note-ticket/${validId}`, {'
  },
  {
    file: 'frontend/app/api/pdf/debug-bl/[id]/route.ts',
    search: 'const response = await fetch(backendUrl, {',
    replace: 'const response = await fetch(`${backendUrl}/pdf/debug-bl/${validId}`, {'
  }
];

console.log('🔧 Correction des endpoints avec IDs manquants...');

corrections.forEach(({ file, search, replace }) => {
  try {
    if (!fs.existsSync(file)) {
      console.log(`⚠️ Fichier non trouvé: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    
    if (content.includes(search)) {
      content = content.replace(search, replace);
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Corrigé: ${file}`);
    } else {
      console.log(`📝 Aucune modification nécessaire: ${file}`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur avec ${file}:`, error.message);
  }
});

console.log('\n🎯 Correction des endpoints avec IDs terminée!');