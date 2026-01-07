// Test direct de la connexion MySQL pour voir les tables disponibles
import mysql from 'mysql2/promise';

async function testMySQLTables() {
  try {
    console.log('🔍 Connexion à MySQL...');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: 'root',
      database: 'stock_management'
    });

    console.log('✅ Connexion MySQL réussie');

    // Lister toutes les tables
    console.log('\n📋 Tables disponibles dans stock_management:');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log(tables);

    // Vérifier spécifiquement la table fprof
    console.log('\n🔍 Vérification de la table fprof:');
    try {
      const [rows] = await connection.execute('SELECT COUNT(*) as count FROM fprof');
      console.log('✅ Table fprof trouvée, nombre de lignes:', rows[0].count);
      
      // Afficher quelques lignes
      const [data] = await connection.execute('SELECT * FROM fprof LIMIT 3');
      console.log('📄 Premières lignes de fprof:', data);
    } catch (error) {
      console.log('❌ Erreur avec la table fprof:', error.message);
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur de connexion MySQL:', error.message);
  }
}

testMySQLTables();