const fs = require('fs');

// Corrections à appliquer
const corrections = [
  {
    file: 'frontend/app/api/sales/invoices/route.ts',
    replacements: [
      {
        search: 'const response = await fetch(backendUrl, {',
        replace: 'const response = await fetch(`${backendUrl}/sales/invoices`, {'
      }
    ]
  },
  {
    file: 'frontend/app/api/sales/invoices/[id]/route.ts',
    replacements: [
      {
        search: 'const response = await fetch(backendUrl, {',
        replace: 'const response = await fetch(`${backendUrl}/sales/invoices/${validId}`, {'
      }
    ]
  },
  {
    file: 'frontend/app/api/sales/delivery-notes/[id]/route.ts',
    replacements: [
      {
        search: 'const response = await fetch(backendUrl, {',
        replace: 'const response = await fetch(`${backendUrl}/sales/delivery-notes/${validId}`, {'
      }
    ]
  },
  {
    file: 'frontend/app/api/database/status/route.ts',
    replacements: [
      {
        search: 'const response = await fetch(backendUrl, {',
        replace: 'const response = await fetch(`${backendUrl}/database/status`, {'
      }
    ]
  }
];

console.log('🔧 Correction des endpoints API...');

corrections.forEach(({ file, replacements }) => {
  try {
    if (!fs.existsSync(file)) {
      console.log(`⚠️ Fichier non trouvé: ${file}`);
      return;
    }
    
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    replacements.forEach(({ search, replace }) => {
      if (content.includes(search)) {
        // Pour les fichiers avec plusieurs occurrences, on remplace toutes
        content = content.replace(new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\\\$&'), 'g'), replace);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Corrigé: ${file}`);
    } else {
      console.log(`📝 Aucune modification: ${file}`);
    }
    
  } catch (error) {
    console.error(`❌ Erreur avec ${file}:`, error.message);
  }
});

console.log('\n🎯 Correction des endpoints terminée!');