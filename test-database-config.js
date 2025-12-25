// Test direct de l'API database-config
const testDatabaseConfig = async () => {
  try {
    console.log('🧪 Testing database-config API...');
    
    const response = await fetch('http://localhost:3005/api/database-config', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        type: 'mysql',
        host: 'localhost',
        port: 3307,
        database: 'stock_management',
        username: 'root',
        password: ''
      })
    });
    
    const data = await response.json();
    console.log('📊 Response:', data);
    
    if (data.success) {
      console.log('✅ Database config test successful!');
    } else {
      console.log('❌ Database config test failed:', data.error);
    }
  } catch (error) {
    console.error('❌ Error testing database config:', error);
  }
};

testDatabaseConfig();