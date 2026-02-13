const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: ''
    });
    
    console.log('✅ Connected to MySQL');
    
    // Test with 2024_bu01
    const sql = 'SELECT * FROM `2024_bu01`.article LIMIT 3';
    console.log('\n🔍 Executing:', sql);
    const [articles] = await connection.execute(sql);
    console.log('\n📦 Articles from 2024_bu01:', JSON.stringify(articles, null, 2));
    
    await connection.end();
    console.log('\n✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Error code:', error.code);
    console.error('SQL State:', error.sqlState);
  }
}

testConnection();
