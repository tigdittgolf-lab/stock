import 'dotenv/config';

async function testArticleCreation() {
  console.log('🔍 Testing article creation...\n');

  try {
    // Test création d'article
    console.log('1. Testing article creation with existing family...');
    const response = await fetch('http://localhost:3005/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        narticle: 'TEST_001',
        famille: 'Electricité',
        designation: 'Test article électricité',
        nfournisseur: null,
        prix_unitaire: 100.00,
        marge: 20.00,
        tva: 19.00,
        seuil: 10,
        stock_f: 50,
        stock_bl: 60
      })
    });
    
    const result = await response.json();
    console.log('✅ Article creation result:', result);

    if (result.success) {
      console.log('🎉 SUCCESS: Article created successfully!');
      
      // Vérifier que l'article est dans la base
      console.log('\n2. Verifying article in database...');
      const checkResponse = await fetch('http://localhost:3005/api/articles', {
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      const checkResult = await checkResponse.json();
      console.log('✅ Articles in database:', checkResult.data?.length || 0);
      
      const testArticle = checkResult.data?.find((a: any) => a.narticle === 'TEST_001');
      if (testArticle) {
        console.log('✅ TEST_001 found in database:', testArticle);
      } else {
        console.log('❌ TEST_001 not found in database');
      }
    } else {
      console.log('❌ Article creation failed:', result.error);
    }

  } catch (error) {
    console.error('❌ Error testing article creation:', error);
  }
}

testArticleCreation();