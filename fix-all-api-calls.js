// Script pour corriger tous les appels API localhost:3005
const fs = require('fs');
const path = require('path');

// Fonction pour corriger un fichier
function fixApiCalls(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Remplacements pour les API sales
    const salesReplacements = [
      ['http://localhost:3005/api/sales/articles', '${window.location.origin}/api/sales/articles'],
      ['http://localhost:3005/api/sales/clients', '${window.location.origin}/api/sales/clients'],
      ['http://localhost:3005/api/sales/suppliers', '${window.location.origin}/api/sales/suppliers'],
      ['http://localhost:3005/api/sales/delivery-notes', '${window.location.origin}/api/sales/delivery-notes'],
      ['http://localhost:3005/api/sales/invoices', '${window.location.origin}/api/sales/invoices'],
      ['http://localhost:3005/api/sales/proforma', '${window.location.origin}/api/sales/proformas'],
    ];

    // Remplacements pour les API purchases
    const purchasesReplacements = [
      ['http://localhost:3005/api/purchases/invoices', '${window.location.origin}/api/purchases/invoices'],
      ['http://localhost:3005/api/purchases/delivery-notes', '${window.location.origin}/api/purchases/delivery-notes'],
    ];

    // Appliquer tous les remplacements
    [...salesReplacements, ...purchasesReplacements].forEach(([oldUrl, newUrl]) => {
      if (content.includes(oldUrl)) {
        content = content.replaceAll(oldUrl, newUrl);
        modified = true;
        console.log(`✅ Fixed ${oldUrl} in ${filePath}`);
      }
    });

    // Sauvegarder si modifié
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`💾 Saved ${filePath}`);
    }

  } catch (error) {
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

// Liste des fichiers critiques à corriger
const criticalFiles = [
  'frontend/app/invoices/page.tsx',
  'frontend/app/invoices/[id]/page.tsx',
  'frontend/app/proforma/page.tsx',
  'frontend/app/proforma/[id]/page.tsx',
  'frontend/app/delivery-notes/page.tsx',
  'frontend/app/purchases/page.tsx',
  'frontend/app/purchases/invoices/[id]/page.tsx',
  'frontend/app/purchases/invoices/[id]/edit/page.tsx',
  'frontend/app/purchases/delivery-notes/[id]/page.tsx',
  'frontend/app/purchases/delivery-notes/page.tsx',
];

console.log('🔧 Fixing API calls in critical files...');
criticalFiles.forEach(fixApiCalls);
console.log('✅ Done!');