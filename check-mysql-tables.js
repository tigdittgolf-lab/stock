// Script pour vérifier les tables MySQL existantes
import mysql from 'mysql2/promise';

const checkTables = async () => {
  console.log('🔍 Vérification des tables MySQL\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: '2025_bu01'
  });

  try {
    // Lister toutes les tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('📋 Tables disponibles:');
    tables.forEach((table, index) => {
      const tableName = Object.values(table)[0];
      console.log(`   ${index + 1}. ${tableName}`);
    });

    console.log('\n');

    // Vérifier la structure de fachat
    console.log('📊 Structure de la table fachat:');
    const [fachatColumns] = await connection.query('DESCRIBE fachat');
    fachatColumns.forEach(col => {
      console.log(`   - ${col.Field} (${col.Type}) ${col.Key ? '[' + col.Key + ']' : ''}`);
    });

    console.log('\n');

    // Vérifier si bachat existe
    const [bachatCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '2025_bu01' AND table_name = 'bachat'"
    );
    
    if (bachatCheck[0].count > 0) {
      console.log('📊 Structure de la table bachat:');
      const [bachatColumns] = await connection.query('DESCRIBE bachat');
      bachatColumns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Key ? '[' + col.Key + ']' : ''}`);
      });
    } else {
      console.log('❌ La table bachat n\'existe pas');
      console.log('💡 Suggestion: Créer la table bachat ou utiliser une table existante pour les BL');
    }

    console.log('\n');

    // Vérifier fachat_detail
    const [fachatDetailCheck] = await connection.query(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = '2025_bu01' AND table_name = 'fachat_detail'"
    );
    
    if (fachatDetailCheck[0].count > 0) {
      console.log('📊 Structure de la table fachat_detail:');
      const [fachatDetailColumns] = await connection.query('DESCRIBE fachat_detail');
      fachatDetailColumns.forEach(col => {
        console.log(`   - ${col.Field} (${col.Type}) ${col.Key ? '[' + col.Key + ']' : ''}`);
      });
    } else {
      console.log('❌ La table fachat_detail n\'existe pas');
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
};

checkTables();
