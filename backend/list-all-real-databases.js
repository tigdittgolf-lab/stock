// Lister TOUTES les bases de données sans filtre
import mysql from 'mysql2/promise';

async function listAllDatabases() {
  console.log('🔍 Connexion à MySQL...\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: ''
  });

  console.log('✅ Connecté!\n');
  console.log('📊 TOUTES vos bases de données:\n');

  // Lister TOUTES les bases sans filtre
  const [rows] = await connection.query('SHOW DATABASES');
  
  rows.forEach((row, index) => {
    const dbName = row.Database;
    // Ignorer seulement les bases système MySQL
    if (!['information_schema', 'mysql', 'performance_schema', 'sys'].includes(dbName)) {
      console.log(`   ${index + 1}. ${dbName}`);
    }
  });

  console.log('\n📁 Bases qui ressemblent à des Business Units:\n');
  
  // Chercher différents patterns
  const patterns = [
    /^\d{4}_bu\d{2}$/,  // 2024_bu01
    /^bu\d{2}_\d{4}$/,  // bu01_2024
    /^\d{4}bu\d{2}$/,   // 2024bu01
    /^stock_\d{4}$/,    // stock_2024
    /^gestion_\d{4}$/,  // gestion_2024
  ];

  const buDatabases = rows.filter(row => {
    const dbName = row.Database;
    return patterns.some(pattern => pattern.test(dbName));
  });

  if (buDatabases.length > 0) {
    buDatabases.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.Database} ✅`);
    });
  } else {
    console.log('   ⚠️  Aucune base trouvée avec les patterns standards');
  }

  await connection.end();
}

listAllDatabases().catch(console.error);
