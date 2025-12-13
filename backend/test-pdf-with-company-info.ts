// Test de génération PDF avec les vraies informations d'entreprise
import { PDFService } from './src/services/pdfService.js';
import { writeFileSync } from 'fs';

async function testPDFWithCompanyInfo() {
  console.log('📄 Testing PDF generation with real company info...\n');

  try {
    const pdfService = new PDFService();

    // Sample delivery note data
    const sampleDeliveryData = {
      nfact: 999,
      date_fact: new Date().toISOString(),
      client: {
        raison_sociale: 'CLIENT TEST ENTREPRISE',
        adresse: 'Adresse du client test, Alger'
      },
      detail_bl: [
        {
          article: {
            designation: 'Article Test 1',
            narticle: 'ART001'
          },
          qte: 2,
          prix: 1500.00,
          tva: 19,
          total_ligne: 3570.00
        },
        {
          article: {
            designation: 'Article Test 2 avec nom plus long',
            narticle: 'ART002'
          },
          qte: 5,
          prix: 850.00,
          tva: 19,
          total_ligne: 5057.50
        }
      ],
      montant_ht: 7250.00,
      tva: 1377.50,
      timbre: 0,
      autre_taxe: 0
    };

    console.log('1️⃣ Testing BL Complet with real company info...');
    const docComplet = await pdfService.generateDeliveryNote(sampleDeliveryData);
    const pdfBufferComplet = docComplet.output('arraybuffer');
    writeFileSync('test_bl_complet_real_company.pdf', Buffer.from(pdfBufferComplet));
    console.log('✅ BL Complet generated: test_bl_complet_real_company.pdf');

    console.log('\n2️⃣ Testing BL Réduit with real company info...');
    const docReduit = await pdfService.generateSmallDeliveryNote(sampleDeliveryData);
    const pdfBufferReduit = docReduit.output('arraybuffer');
    writeFileSync('test_bl_reduit_real_company.pdf', Buffer.from(pdfBufferReduit));
    console.log('✅ BL Réduit generated: test_bl_reduit_real_company.pdf');

    console.log('\n3️⃣ Testing Ticket with real company info...');
    const docTicket = await pdfService.generateTicketReceipt(sampleDeliveryData);
    const pdfBufferTicket = docTicket.output('arraybuffer');
    writeFileSync('test_ticket_real_company.pdf', Buffer.from(pdfBufferTicket));
    console.log('✅ Ticket generated: test_ticket_real_company.pdf');

    // Sample invoice data
    const sampleInvoiceData = {
      nfact: 888,
      date_fact: new Date().toISOString(),
      client: {
        raison_sociale: 'CLIENT FACTURE TEST',
        adresse: 'Adresse du client facture, Oran',
        nif: '123456789012345',
        rc: '16/00-1234567B16'
      },
      detail_fact: [
        {
          article: {
            designation: 'Produit Premium',
            narticle: 'PREM001'
          },
          qte: 3,
          prix: 2500.00,
          tva: 19,
          total_ligne: 8925.00
        }
      ],
      montant_ht: 7500.00,
      tva: 1425.00,
      timbre: 25.00,
      autre_taxe: 0.00
    };

    console.log('\n4️⃣ Testing Facture with real company info...');
    const docFacture = await pdfService.generateInvoice(sampleInvoiceData);
    const pdfBufferFacture = docFacture.output('arraybuffer');
    writeFileSync('test_facture_real_company.pdf', Buffer.from(pdfBufferFacture));
    console.log('✅ Facture generated: test_facture_real_company.pdf');

    console.log('\n5️⃣ Testing Proforma with real company info...');
    const docProforma = await pdfService.generateProforma(sampleInvoiceData);
    const pdfBufferProforma = docProforma.output('arraybuffer');
    writeFileSync('test_proforma_real_company.pdf', Buffer.from(pdfBufferProforma));
    console.log('✅ Proforma generated: test_proforma_real_company.pdf');

    console.log('\n🎉 All PDF tests completed successfully!');
    console.log('\n📋 Generated files:');
    console.log('  - test_bl_complet_real_company.pdf');
    console.log('  - test_bl_reduit_real_company.pdf');
    console.log('  - test_ticket_real_company.pdf');
    console.log('  - test_facture_real_company.pdf');
    console.log('  - test_proforma_real_company.pdf');

  } catch (error) {
    console.error('❌ PDF test failed:', error);
  }
}

// Run the test
testPDFWithCompanyInfo();