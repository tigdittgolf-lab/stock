// Test de vérification des données dans les bases
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function testDataAccess() {
  console.log('🔍 VÉRIFICATION DES DONNÉES');
  console.log('='.repeat(50));
  
  try {
    // Authentification
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    
    // Test MySQL avec données
    console.log('\n🐬 TEST MYSQL AVEC DONNÉES');
    console.log('-'.repeat(30));
    
    await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ database: 'mysql' })
    });
    
    // Test direct avec RPC
    const rpcResponse = await fetch(`${TUNNEL_URL}/api/database`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        function: 'get_articles_by_tenant',
        params: { p_tenant: '2025_bu01' }
      })
    });
    
    if (rpcResponse.ok) {
      const rpcData = await rpcResponse.json();
      console.log('✅ RPC Articles MySQL:', rpcData.data?.length || 0, 'articles');
      if (rpcData.data && rpcData.data.length > 0) {
        console.log('   Premier article:', rpcData.data[0].designation);
      }
    } else {
      console.log('❌ Erreur RPC MySQL:', rpcResponse.status);
    }
    
    // Test via API articles
    const articlesResponse = await fetch(`${TUNNEL_URL}/api/articles`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (articlesResponse.ok) {
      const articlesData = await articlesResponse.json();
      const articles = articlesData.data || articlesData; // Handle both formats
      console.log('✅ API Articles MySQL:', articles.length || 0, 'articles');
      if (articles.length > 0) {
        console.log('   Premier article API:', articles[0].designation);
        console.log('   Source:', articlesData.source);
        console.log('   Database type:', articlesData.database_type);
      }
    } else {
      console.log('❌ Erreur API Articles MySQL:', articlesResponse.status);
      const errorText = await articlesResponse.text();
      console.log('   Détail erreur:', errorText.substring(0, 200));
    }
    
    // Test fournisseurs
    const suppliersResponse = await fetch(`${TUNNEL_URL}/api/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (suppliersResponse.ok) {
      const suppliersData = await suppliersResponse.json();
      const suppliers = suppliersData.data || suppliersData; // Handle both formats
      console.log('✅ API Fournisseurs MySQL:', suppliers.length || 0, 'fournisseurs');
      if (suppliers.length > 0) {
        console.log('   Premier fournisseur:', suppliers[0].nom_fournisseur);
        console.log('   Source:', suppliersData.source);
      }
    } else {
      console.log('❌ Erreur API Fournisseurs MySQL:', suppliersResponse.status);
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testDataAccess();