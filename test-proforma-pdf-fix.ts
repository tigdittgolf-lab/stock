// Test pour vérifier la correction du PDF proforma
import { PDFService } from './backend/src/services/pdfService.js';
import { writeFileSync } from 'fs';

async function testProformaPDF() {
  console.log('🧪 Testing Proforma PDF generation...');
  
  const pdfService = new PDFService();
  
  // Données de test pour proforma
  const sampleProformaData = {
    nfact: 1,
    date_fact: '2025-12-15',
    client: {
      raison_sociale: 'cl1 nom1',
      adresse: 'Mostaganem',
      nif: 'ml65464653le',
      rc: ''
    },
    detail_fact: [
      {
        article: {
          narticle: '1000',
          designation: 'Gillet jaune'
        },
        qte: 5,
        prix: 1856.40,
        tva: 19,
        total_ligne: 11036.18
      },
      {
        article: {
          narticle: '1112', 
          designation: 'peinture lavable'
        },
        qte: 10,
        prix: 1285.20,
        tva: 19,
        total_ligne: 15293.88
      }
    ],
    montant_ht: 22134.00,
    tva: 4205.46,
    timbre: 0,
    autre_taxe: 0
  };

  try {
    // Générer le PDF proforma avec les vraies informations de l'entreprise
    const doc = await pdfService.generateProforma(sampleProformaData, '2025_bu01');
    const pdfBuffer = doc.output('arraybuffer');
    
    // Sauvegarder le PDF pour vérification
    writeFileSync('test_proforma_fixed.pdf', Buffer.from(pdfBuffer));
    
    console.log('✅ PDF proforma généré avec succès !');
    console.log('📄 Fichier sauvegardé: test_proforma_fixed.pdf');
    console.log('🔍 Vérifiez que:');
    console.log('   - Le titre est "FACTURE PROFORMA" (pas de chevauchement)');
    console.log('   - Les informations de l\'entreprise sont lisibles');
    console.log('   - Le montant en lettres est affiché correctement');
    console.log('   - La note proforma est visible en rouge');
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du PDF:', error);
  }
}

// Exécuter le test
testProformaPDF();