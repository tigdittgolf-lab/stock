// Test du système de BL d'achats
const testPurchaseBLSystem = async () => {
  try {
    console.log('🧪 Testing Purchase BL System...');
    
    // Test 1: Vérifier que le backend répond
    console.log('\n✅ Test 1: Backend health check');
    const healthResponse = await fetch('http://localhost:3005/health');
    if (healthResponse.ok) {
      console.log('✅ Backend is responding');
    } else {
      console.log('❌ Backend health check failed');
      return;
    }
    
    // Test 2: Récupérer la liste des BL d'achats
    console.log('\n📋 Test 2: Fetch purchase BL list');
    const listResponse = await fetch('http://localhost:3005/api/purchases/delivery-notes', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const listData = await listResponse.json();
    console.log('Purchase BL list:', listData);
    
    // Test 3: Créer un BL d'achat avec validation fournisseur-articles
    console.log('\n🆕 Test 3: Create purchase BL with supplier-article validation');
    const createResponse = await fetch('http://localhost:3005/api/purchases/delivery-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        Nfournisseur: 'FOURNISSEUR 1',
        numero_bl_fournisseur: 'BL-TEST-2025-001',
        date_bl: '2025-12-16',
        detail_bl_achat: [
          {
            Narticle: '1000', // Appartient à FOURNISSEUR 1
            Qte: 10,
            prix: 120.00,
            tva: 19
          }
        ]
      })
    });
    
    const createData = await createResponse.json();
    console.log('BL creation result:', createData);
    
    // Test 4: Essayer de créer un BL avec un article incorrect (validation)
    console.log('\n❌ Test 4: Try to create BL with wrong supplier article (should fail)');
    const invalidResponse = await fetch('http://localhost:3005/api/purchases/delivery-notes', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        Nfournisseur: 'FOURNISSEUR 1',
        numero_bl_fournisseur: 'BL-TEST-INVALID-001',
        date_bl: '2025-12-16',
        detail_bl_achat: [
          {
            Narticle: '1112', // Appartient à FOURNISSEUR 2, pas FOURNISSEUR 1
            Qte: 5,
            prix: 80.00,
            tva: 19
          }
        ]
      })
    });
    
    const invalidData = await invalidResponse.json();
    console.log('Invalid BL creation (should fail):', invalidData);
    
    // Test 5: Vérifier les stocks après création BL
    console.log('\n📦 Test 5: Check stock levels after BL creation');
    const articlesResponse = await fetch('http://localhost:3005/api/sales/articles', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const articlesData = await articlesResponse.json();
    if (articlesData.success) {
      console.log('Stock levels after BL creation:');
      articlesData.data.forEach(article => {
        console.log(`- ${article.narticle}: ${article.designation} | Stock BL: ${article.stock_bl} | Stock F: ${article.stock_f}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
};

// Run the test
testPurchaseBLSystem();