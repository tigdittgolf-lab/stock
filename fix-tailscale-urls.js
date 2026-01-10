const fs = require('fs');
const path = require('path');

// URL Tailscale correcte
const TAILSCALE_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
const OLD_URL = 'https://frontend-iota-six-72.vercel.app';

// Fonction pour remplacer les URLs dans un fichier
function replaceUrlsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Remplacer toutes les occurrences de l'ancienne URL
    if (content.includes(OLD_URL)) {
      content = content.replace(new RegExp(OLD_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), TAILSCALE_URL);
      modified = true;
    }
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✅ Corrigé: ${filePath}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Erreur avec ${filePath}:`, error.message);
    return false;
  }
}

// Liste des fichiers à corriger
const filesToFix = [
  'frontend/app/api/suppliers/route.ts',
  'frontend/app/api/sales/suppliers/route.ts',
  'frontend/app/api/sales/proformas/route.ts',
  'frontend/app/api/sales/proforma/[id]/route.ts',
  'frontend/app/api/sales/proforma/route.ts',
  'frontend/app/api/sales/proforma/next-number/route.ts',
  'frontend/app/api/sales/invoices/[id]/route.ts',
  'frontend/app/api/sales/invoices/route.ts',
  'frontend/app/api/sales/delivery-notes/[id]/route.ts',
  'frontend/app/api/sales/delivery-notes/[id]/edit/route.ts',
  'frontend/app/api/sales/delivery-notes/route.ts',
  'frontend/app/api/sales/clients/route.ts',
  'frontend/app/api/sales/articles/route.ts',
  'frontend/app/api/rpc/get_fact_for_pdf/route.ts',
  'frontend/app/api/pdf/delivery-note/[id]/route.ts',
  'frontend/app/api/pdf/proforma/[id]/route.ts',
  'frontend/app/api/pdf/delivery-note-ticket/[id]/route.ts',
  'frontend/app/api/pdf/invoice/[id]/route.ts',
  'frontend/app/api/pdf/debug-bl/[id]/route.ts',
  'frontend/app/api/pdf/delivery-note-small/[id]/route.ts',
  'frontend/app/api/database/test/route.ts',
  'frontend/app/api/database/switch/route.ts',
  'frontend/app/api/database/status/route.ts'
];

console.log(`🔄 Correction des URLs Tailscale dans ${filesToFix.length} fichiers...`);
console.log(`📍 Ancienne URL: ${OLD_URL}`);
console.log(`📍 Nouvelle URL: ${TAILSCALE_URL}`);

let correctedCount = 0;

filesToFix.forEach(file => {
  if (fs.existsSync(file)) {
    if (replaceUrlsInFile(file)) {
      correctedCount++;
    }
  } else {
    console.log(`⚠️ Fichier non trouvé: ${file}`);
  }
});

console.log(`\n📊 Résumé:`);
console.log(`✅ ${correctedCount} fichiers corrigés`);
console.log(`📁 ${filesToFix.length - correctedCount} fichiers non modifiés ou non trouvés`);
console.log(`\n🎯 Toutes les URLs pointent maintenant vers Tailscale: ${TAILSCALE_URL}`);