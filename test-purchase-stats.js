// Test du système de statistiques achats
const testPurchaseStats = async () => {
  try {
    console.log('📊 Testing Purchase Statistics System...');
    
    const tenant = '2025_bu01';
    const baseUrl = 'http://localhost:3005/api/purchases/stats';
    
    // Test 1: Vue d'ensemble
    console.log('\n📈 Test 1: Overview Statistics');
    const overviewResponse = await fetch(`${baseUrl}/overview`, {
      headers: { 'X-Tenant': tenant }
    });
    const overviewData = await overviewResponse.json();
    console.log('Overview:', JSON.stringify(overviewData, null, 2));
    
    // Test 2: Statistiques par fournisseur
    console.log('\n🏭 Test 2: Supplier Statistics');
    const suppliersResponse = await fetch(`${baseUrl}/suppliers`, {
      headers: { 'X-Tenant': tenant }
    });
    const suppliersData = await suppliersResponse.json();
    console.log('Suppliers:', JSON.stringify(suppliersData, null, 2));
    
    // Test 3: Statistiques par article
    console.log('\n📦 Test 3: Article Statistics');
    const articlesResponse = await fetch(`${baseUrl}/articles`, {
      headers: { 'X-Tenant': tenant }
    });
    const articlesData = await articlesResponse.json();
    console.log('Articles:', JSON.stringify(articlesData, null, 2));
    
    // Test 4: Tendances mensuelles
    console.log('\n📈 Test 4: Monthly Trends');
    const trendsResponse = await fetch(`${baseUrl}/trends?year=2025`, {
      headers: { 'X-Tenant': tenant }
    });
    const trendsData = await trendsResponse.json();
    console.log('Trends:', JSON.stringify(trendsData, null, 2));
    
    // Test 5: Activité récente
    console.log('\n🕒 Test 5: Recent Activity');
    const recentResponse = await fetch(`${baseUrl}/recent?limit=5`, {
      headers: { 'X-Tenant': tenant }
    });
    const recentData = await recentResponse.json();
    console.log('Recent Activity:', JSON.stringify(recentData, null, 2));
    
    console.log('\n✅ All statistics tests completed!');
    
  } catch (error) {
    console.error('❌ Statistics test failed:', error);
  }
};

// Run the test
testPurchaseStats();