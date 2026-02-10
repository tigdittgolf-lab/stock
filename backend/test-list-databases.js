// Script simple pour lister vos bases de données MySQL
import mysql from 'mysql2/promise';

async function listDatabases() {
  console.log('🔍 Connexion à MySQL...\n');
  
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: ''
    });

    console.log('✅ Connecté!\n');
    console.log('📊 Vos bases de données:\n');

    // Lister toutes les bases
    const [rows] = await connection.query('SHOW DATABASES');
    
    rows.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.Database}`);
    });

    console.log('\n📁 Bases de type Business Unit (YYYY_buXX):\n');
    
    // Filtrer les bases BU
    const buDatabases = rows.filter(row => 
      /^\d{4}_bu\d{2}$/.test(row.Database)
    );

    if (buDatabases.length === 0) {
      console.log('   ⚠️  Aucune base trouvée avec le format YYYY_buXX');
      console.log('   💡 Exemples attendus: 2024_bu01, 2025_bu01, etc.');
    } else {
      buDatabases.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.Database} ✅`);
      });
    }

    await connection.end();
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.log('\n💡 Vérifiez:');
    console.log('   - MySQL est démarré');
    console.log('   - Port 3307 est correct');
    console.log('   - Mot de passe root est vide');
  }
}

listDatabases();
