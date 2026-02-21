const fs = require('fs');
const path = require('path');

const TAILSCALE_URL = 'https://desktop-bhhs068.tail1d9c54.ts.net';
const CLOUDFLARE_URL = 'https://midi-charm-harvard-performed.trycloudflare.com';

const filesToFix = [
  'frontend/app/api/suppliers/route.ts',
  'frontend/app/api/settings/activities/route.ts',
  'frontend/app/api/sales/proformas/route.ts',
  'frontend/app/api/sales/proforma/[id]/route.ts',
  'frontend/app/api/sales/invoices/route.ts',
  'frontend/app/api/sales/invoices/[id]/route.ts',
  'frontend/app/api/sales/proforma/route.ts',
  'frontend/app/api/sales/proforma/next-number/route.ts',
  'frontend/app/api/sales/delivery-notes/route.ts'
];

console.log('🔧 Remplacement de Tailscale par Cloudflare dans les routes API...\n');

let fixedCount = 0;

filesToFix.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      const originalContent = content;
      
      // Remplacer l'URL Tailscale par Cloudflare
      content = content.replace(/https:\/\/desktop-bhhs068\.tail1d9c54\.ts\.net/g, CLOUDFLARE_URL);
      
      if (content !== originalContent) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`✅ ${file}`);
        fixedCount++;
      } else {
        console.log(`⏭️  ${file} (déjà à jour)`);
      }
    } else {
      console.log(`⚠️  ${file} (fichier non trouvé)`);
    }
  } catch (error) {
    console.error(`❌ ${file}: ${error.message}`);
  }
});

console.log(`\n✅ ${fixedCount} fichiers corrigés`);
console.log(`\n🔄 Prochaine étape: git add, commit et push`);
