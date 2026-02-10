import mysql from 'mysql2/promise';

async function showTables() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    database: '2025_bu01'
  });

  console.log('📊 Tables dans 2025_bu01:\n');
  
  const [tables] = await connection.query('SHOW TABLES');
  
  tables.forEach((row, index) => {
    const tableName = Object.values(row)[0];
    console.log(`   ${index + 1}. ${tableName}`);
  });

  await connection.end();
}

showTables();
