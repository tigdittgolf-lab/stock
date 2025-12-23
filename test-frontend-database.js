// Test script pour vérifier que le frontend utilise la bonne base de données
async function testFrontendDatabase() {
  try {
    console.log('🧪 Test frontend - changement de base de données...');
    
    // 1. Forcer le changement via l'API frontend
    const frontendSwitchResponse = await fetch('http://localhost:3000/api/database/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'mysql',
        config: {
          name: 'MySQL Local',
          host: 'localhost',
          port: 3306,
          database: '2025_bu01',
          username: 'root',
          password: ''
        }
      })
    });
    
    const frontendSwitchData = await frontendSwitchResponse.json();
    console.log('🔄 Frontend switch result:', frontendSwitchData);
    
    // 2. Vérifier l'état du backend après le switch frontend
    const backendCurrentResponse = await fetch('http://localhost:3005/api/database/current');
    const backendCurrentData = await backendCurrentResponse.json();
    console.log('📊 Backend state after frontend switch:', backendCurrentData);
    
    // 3. Tester les articles via le backend directement
    const articlesResponse = await fetch('http://localhost:3005/api/articles', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const articlesData = await articlesResponse.json();
    console.log('📦 Articles from backend:', articlesData.data?.length, 'articles');
    console.log('📦 Database type:', articlesData.database_type);
    
  } catch (error) {
    console.error('❌ Erreur test frontend:', error);
  }
}

testFrontendDatabase();