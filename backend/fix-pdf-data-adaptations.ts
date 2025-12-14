// Corriger les adaptations de données dans pdf.ts
import { readFileSync, writeFileSync } from 'fs';

function fixPDFDataAdaptations() {
  console.log('🔧 Fixing PDF data adaptations...');
  
  try {
    let content = readFileSync('./src/routes/pdf.ts', 'utf8');
    
    // Remplacer toutes les occurrences de blData.raison_sociale par blData.client_name
    content = content.replace(/blData\.raison_sociale/g, 'blData.client_name');
    
    // Remplacer toutes les occurrences de blData.adresse par blData.client_address
    content = content.replace(/blData\.adresse/g, 'blData.client_address');
    
    // Corriger les références NFact (majuscule) vers nfact (minuscule)
    content = content.replace(/blData\.NFact/g, 'blData.nfact');
    
    // Sauvegarder
    writeFileSync('./src/routes/pdf.ts', content, 'utf8');
    
    console.log('✅ PDF data adaptations fixed successfully!');
    console.log('🔧 Fixed:');
    console.log('   - blData.raison_sociale → blData.client_name');
    console.log('   - blData.adresse → blData.client_address');
    console.log('   - blData.NFact → blData.nfact');
    
  } catch (error) {
    console.error('❌ Failed to fix adaptations:', error);
  }
}

fixPDFDataAdaptations();