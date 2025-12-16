// Test pour générer un PDF proforma et identifier les chevauchements
import { PDFService } from './backend/src/services/pdfService.js';
import { writeFileSync } from 'fs';

async function generateTestProformaPDF() {
  console.log('🧪 Génération d\'un PDF proforma de test...');
  
  const pdfService = new PDFService();
  
  // Données réelles comme dans votre exemple
  const realProformaData = {
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
    // Générer le PDF avec les vraies infos entreprise
    const doc = await pdfService.generateProforma(realProformaData, '2025_bu01');
    const pdfBuffer = doc.output('arraybuffer');
    
    // Sauvegarder pour inspection visuelle
    writeFileSync('proforma_test_chevauchement.pdf', Buffer.from(pdfBuffer));
    
    console.log('✅ PDF généré: proforma_test_chevauchement.pdf');
    console.log('');
    console.log('🔍 ANALYSE DU POSITIONNEMENT:');
    console.log('   Y=20  : FACTURE PROFORMA (titre)');
    console.log('   Y=30  : Ligne de séparation');
    console.log('   Y=45  : Début infos entreprise');
    console.log('   Y=45  : ETS BENAMAR BOUZID MENOUAR');
    console.log('   Y=50  : Commerce Outillage et Équipements');
    console.log('   Y=54  : 10, Rue Belhandouz A.E.K...');
    console.log('   Y=59  : Tél: (213)045.42.35.20');
    console.log('   Y=64  : Email: outillagesaada@gmail.com');
    console.log('   Y=69  : NIF: 10227010185816600000');
    console.log('   Y=74  : RC: 21A3965999-27/00');
    console.log('   Y=79  : Art: 100227010185845');
    console.log('   Y=84  : Fin infos entreprise');
    console.log('');
    console.log('   Y=45  : Proforma N: 1 (côté droit)');
    console.log('   Y=50  : Date: 15/12/2025 (côté droit)');
    console.log('');
    console.log('   Y=94  : Client: (après espacement)');
    console.log('   Y=99  : cl1 nom1');
    console.log('   Y=104 : Mostaganem');
    console.log('');
    console.log('   Y=114 : En-têtes tableau');
    console.log('');
    console.log('📋 Ouvrez le fichier PDF pour vérifier visuellement les chevauchements');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

generateTestProformaPDF();