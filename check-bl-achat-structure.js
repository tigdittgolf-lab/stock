// Vérifier la structure de bl_achat
import mysql from 'mysql2/promise';

const checkBLAchat = async () => {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: '2025_bu01'
  });

  try {
    console.log('📊 Structure de la table bl_achat:\n');
    const [columns] = await connection.query('DESCRIBE bl_achat');
    columns.forEach(col => {
      console.log(`   ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Key ? '[' + col.Key + ']' : ''} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n📊 Structure de la table detail_bl_achat:\n');
    const [detailColumns] = await connection.query('DESCRIBE detail_bl_achat');
    detailColumns.forEach(col => {
      console.log(`   ${col.Field.padEnd(25)} ${col.Type.padEnd(20)} ${col.Key ? '[' + col.Key + ']' : ''} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    console.log('\n📊 Données existantes dans bl_achat:\n');
    const [data] = await connection.query('SELECT * FROM bl_achat LIMIT 5');
    console.log(`   ${data.length} enregistrements trouvés`);
    if (data.length > 0) {
      console.log('   Exemple:', JSON.stringify(data[0], null, 2));
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await connection.end();
  }
};

checkBLAchat();
