// Test de validation fournisseur-articles
const testSupplierArticleValidation = async () => {
  try {
    console.log('🧪 Testing Supplier-Article Validation...');
    
    // Test 1: Essayer de créer une facture avec un article qui n'appartient pas au fournisseur
    console.log('\n❌ Test 1: Article incorrect pour le fournisseur');
    const invalidResponse = await fetch('http://localhost:3005/api/purchases/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        Nfournisseur: 'FOURNISSEUR 1',
        numero_facture_fournisseur: 'TEST-INVALID-2025-001',
        date_fact: '2025-12-16',
        detail_fact_achat: [
          {
            Narticle: '1112', // Article qui pourrait appartenir à un autre fournisseur
            Qte: 5,
            prix: 100.00,
            tva: 19
          }
        ]
      })
    });
    
    const invalidData = await invalidResponse.json();
    console.log('Résultat (devrait échouer):', invalidData);
    
    // Test 2: Créer une facture avec un article correct
    console.log('\n✅ Test 2: Article correct pour le fournisseur');
    const validResponse = await fetch('http://localhost:3005/api/purchases/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        Nfournisseur: 'FOURNISSEUR 1',
        numero_facture_fournisseur: 'TEST-VALID-2025-001',
        date_fact: '2025-12-16',
        detail_fact_achat: [
          {
            Narticle: '1000', // Article qui appartient au FOURNISSEUR 1
            Qte: 5,
            prix: 100.00,
            tva: 19
          }
        ]
      })
    });
    
    const validData = await validResponse.json();
    console.log('Résultat (devrait réussir):', validData);
    
    // Test 3: Vérifier les articles disponibles
    console.log('\n📋 Test 3: Articles disponibles');
    const articlesResponse = await fetch('http://localhost:3005/api/sales/articles', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const articlesData = await articlesResponse.json();
    if (articlesData.success) {
      console.log('Articles et leurs fournisseurs:');
      articlesData.data.forEach(article => {
        console.log(`- ${article.narticle}: ${article.designation} (Fournisseur: ${article.nfournisseur || 'NON ASSIGNÉ'})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testSupplierArticleValidation();