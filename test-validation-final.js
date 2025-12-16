// Test final de validation fournisseur-articles
const testFinalValidation = async () => {
  try {
    console.log('🧪 Test Final: Validation Fournisseur-Articles...');
    
    // Test 1: Article 1112 (FOURNISSEUR 2) avec FOURNISSEUR 1 → DOIT ÉCHOUER
    console.log('\n❌ Test 1: Article 1112 (FOURNISSEUR 2) avec FOURNISSEUR 1');
    const invalidResponse = await fetch('http://localhost:3005/api/purchases/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        Nfournisseur: 'FOURNISSEUR 1',
        numero_facture_fournisseur: 'TEST-VALIDATION-001',
        date_fact: '2025-12-16',
        detail_fact_achat: [
          {
            Narticle: '1112', // Appartient à FOURNISSEUR 2, pas FOURNISSEUR 1
            Qte: 5,
            prix: 100.00,
            tva: 19
          }
        ]
      })
    });
    
    const invalidData = await invalidResponse.json();
    console.log('Résultat:', invalidData);
    
    // Test 2: Article 1000 (FOURNISSEUR 1) avec FOURNISSEUR 1 → DOIT RÉUSSIR
    console.log('\n✅ Test 2: Article 1000 (FOURNISSEUR 1) avec FOURNISSEUR 1');
    const validResponse = await fetch('http://localhost:3005/api/purchases/invoices', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        Nfournisseur: 'FOURNISSEUR 1',
        numero_facture_fournisseur: 'TEST-VALIDATION-002',
        date_fact: '2025-12-16',
        detail_fact_achat: [
          {
            Narticle: '1000', // Appartient bien à FOURNISSEUR 1
            Qte: 3,
            prix: 150.00,
            tva: 19
          }
        ]
      })
    });
    
    const validData = await validResponse.json();
    console.log('Résultat:', validData);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testFinalValidation();