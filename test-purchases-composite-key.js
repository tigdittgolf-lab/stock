// =====================================================
// TEST DU SYSTÈME D'ACHATS AVEC CLÉ COMPOSITE
// Test des BL et factures d'achats avec clé (numero_fournisseur, nfournisseur)
// =====================================================

const baseUrl = 'http://localhost:3005';
const tenant = '2025_bu01';

const testPurchasesCompositeKey = async () => {
  console.log('🧪 TEST DU SYSTÈME D\'ACHATS AVEC CLÉ COMPOSITE\n');
  console.log('='.repeat(60));

  try {
    // ===== TEST 1: Créer un BL d'achat =====
    console.log('\n📦 TEST 1: Créer un BL d\'achat avec clé composite');
    console.log('-'.repeat(60));
    
    const blData = {
      Nfournisseur: 'FOURNISSEUR 1',  // Avec espace
      numero_bl_fournisseur: 'BL-FOUR1-2025-001',
      date_bl: '2025-02-15',
      detail_bl_achat: [
        {
          Narticle: '1000',
          Qte: 50,
          prix: 800.00,
          tva: 19.00
        }
      ]
    };

    console.log('📤 Envoi des données BL:', JSON.stringify(blData, null, 2));

    const blResponse = await fetch(`${baseUrl}/api/purchases/delivery-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      body: JSON.stringify(blData)
    });

    const blResult = await blResponse.json();
    console.log('📥 Réponse BL:', JSON.stringify(blResult, null, 2));

    if (blResult.success) {
      console.log('✅ BL créé avec succès !');
      console.log(`   - Numéro BL: ${blResult.data.numero_bl_fournisseur}`);
      console.log(`   - Fournisseur: ${blResult.data.nfournisseur}`);
      console.log(`   - Montant HT: ${blResult.data.montant_ht} DA`);
      console.log(`   - TVA: ${blResult.data.tva} DA`);
      console.log(`   - Total TTC: ${blResult.data.montant_ttc} DA`);
    } else {
      console.log('❌ Erreur création BL:', blResult.error);
    }

    // ===== TEST 2: Tenter de créer le même BL (doit échouer) =====
    console.log('\n🔒 TEST 2: Tenter de créer un BL en double (doit échouer)');
    console.log('-'.repeat(60));

    const duplicateBLResponse = await fetch(`${baseUrl}/api/purchases/delivery-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      body: JSON.stringify(blData)
    });

    const duplicateBLResult = await duplicateBLResponse.json();
    console.log('📥 Réponse doublon BL:', JSON.stringify(duplicateBLResult, null, 2));

    if (!duplicateBLResult.success) {
      console.log('✅ Doublon correctement rejeté !');
      console.log(`   - Message: ${duplicateBLResult.error}`);
    } else {
      console.log('❌ ERREUR: Le doublon n\'a pas été rejeté !');
    }

    // ===== TEST 3: Créer un BL avec le même numéro mais un autre fournisseur (doit réussir) =====
    console.log('\n🔄 TEST 3: Créer un BL avec même numéro mais autre fournisseur (doit réussir)');
    console.log('-'.repeat(60));

    const blData2 = {
      Nfournisseur: 'FOURNISSEUR 2',  // Avec espace
      numero_bl_fournisseur: 'BL-FOUR1-2025-001', // Même numéro mais autre fournisseur
      date_bl: '2025-02-15',
      detail_bl_achat: [
        {
          Narticle: '1000',  // Utiliser un article existant
          Qte: 20,
          prix: 1500.00,
          tva: 19.00
        }
      ]
    };

    console.log('📤 Envoi BL fournisseur 2:', JSON.stringify(blData2, null, 2));

    const bl2Response = await fetch(`${baseUrl}/api/purchases/delivery-notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      body: JSON.stringify(blData2)
    });

    const bl2Result = await bl2Response.json();
    console.log('📥 Réponse BL fournisseur 2:', JSON.stringify(bl2Result, null, 2));

    if (bl2Result.success) {
      console.log('✅ BL créé avec succès pour le fournisseur 2 !');
      console.log(`   - Même numéro BL mais fournisseur différent: OK`);
    } else {
      console.log('❌ Erreur:', bl2Result.error);
    }

    // ===== TEST 4: Créer une facture d'achat =====
    console.log('\n📄 TEST 4: Créer une facture d\'achat avec clé composite');
    console.log('-'.repeat(60));

    const invoiceData = {
      Nfournisseur: 'FOURNISSEUR 1',  // Avec espace
      numero_facture_fournisseur: 'FAC-FOUR1-2025-001',
      date_fact: '2025-02-15',
      detail_fact_achat: [
        {
          Narticle: '1000',
          Qte: 100,
          prix: 750.00,
          tva: 19.00
        }
      ]
    };

    console.log('📤 Envoi facture:', JSON.stringify(invoiceData, null, 2));

    const invoiceResponse = await fetch(`${baseUrl}/api/purchases/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      body: JSON.stringify(invoiceData)
    });

    const invoiceResult = await invoiceResponse.json();
    console.log('📥 Réponse facture:', JSON.stringify(invoiceResult, null, 2));

    if (invoiceResult.success) {
      console.log('✅ Facture créée avec succès !');
      console.log(`   - Numéro facture: ${invoiceResult.data.numero_facture_fournisseur}`);
      console.log(`   - Fournisseur: ${invoiceResult.data.nfournisseur}`);
      console.log(`   - Montant TTC: ${invoiceResult.data.montant_ttc} DA`);
    } else {
      console.log('❌ Erreur création facture:', invoiceResult.error);
    }

    // ===== TEST 5: Récupérer la liste des BL =====
    console.log('\n📋 TEST 5: Récupérer la liste des BL d\'achat');
    console.log('-'.repeat(60));

    const listBLResponse = await fetch(`${baseUrl}/api/purchases/delivery-notes`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant
      }
    });

    const listBLResult = await listBLResponse.json();
    console.log('📥 Liste des BL:', JSON.stringify(listBLResult, null, 2));

    if (listBLResult.success) {
      console.log(`✅ ${listBLResult.data.length} BL trouvés`);
      listBLResult.data.forEach((bl, index) => {
        console.log(`   ${index + 1}. ${bl.numero_bl_fournisseur} - ${bl.nfournisseur} - ${bl.total_ttc} DA`);
      });
    }

    // ===== TEST 6: Récupérer un BL spécifique =====
    console.log('\n🔍 TEST 6: Récupérer un BL spécifique par clé composite');
    console.log('-'.repeat(60));

    const getBLResponse = await fetch(
      `${baseUrl}/api/purchases/delivery-notes/BL-FOUR1-2025-001/FOURNISSEUR%201`,  // URL encodé
      {
        method: 'GET',
        headers: {
          'X-Tenant': tenant
        }
      }
    );

    const getBLResult = await getBLResponse.json();
    console.log('📥 Détails BL:', JSON.stringify(getBLResult, null, 2));

    if (getBLResult.success) {
      console.log('✅ BL récupéré avec succès !');
      console.log(`   - Articles: ${getBLResult.data.details?.length || 0}`);
    }

    // ===== TEST 7: Récupérer la liste des factures =====
    console.log('\n📋 TEST 7: Récupérer la liste des factures d\'achat');
    console.log('-'.repeat(60));

    const listInvoicesResponse = await fetch(`${baseUrl}/api/purchases/invoices`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant
      }
    });

    const listInvoicesResult = await listInvoicesResponse.json();
    console.log('📥 Liste des factures:', JSON.stringify(listInvoicesResult, null, 2));

    if (listInvoicesResult.success) {
      console.log(`✅ ${listInvoicesResult.data.length} factures trouvées`);
      listInvoicesResult.data.forEach((invoice, index) => {
        console.log(`   ${index + 1}. ${invoice.numero_facture_fournisseur} - ${invoice.nfournisseur} - ${invoice.total_ttc} DA`);
      });
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ TESTS TERMINÉS AVEC SUCCÈS !');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ ERREUR LORS DES TESTS:', error);
    console.error('Stack:', error.stack);
  }
};

// Exécuter les tests
testPurchasesCompositeKey();
