// Synchroniser toutes les bases depuis 2025_bu01 (la base maître)
import mysql from 'mysql2/promise';

async function syncFromMaster() {
  console.log('🔄 Synchronisation depuis la base maître: 2025_bu01\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: '',
    multipleStatements: true
  });

  const masterDB = '2025_bu01';
  const targetDBs = [
    '2009_bu02',
    '2024_bu01',
    '2025_bu02',
    '2026_bu01',
    '2099_bu02'
  ];

  console.log('📊 Étape 1: Récupération de la structure de', masterDB, '\n');
  
  // Obtenir la structure complète de la base maître
  await connection.query(`USE \`${masterDB}\``);
  const [tables] = await connection.query('SHOW TABLES');
  
  const tableStructures = {};
  
  for (const row of tables) {
    const tableName = Object.values(row)[0];
    
    // Ignorer la table _migrations (elle sera gérée par le système)
    if (tableName === '_migrations') continue;
    
    const [createTable] = await connection.query(`SHOW CREATE TABLE \`${tableName}\``);
    tableStructures[tableName] = createTable[0]['Create Table'];
    
    console.log(`   ✅ ${tableName}`);
  }

  console.log(`\n📊 Étape 2: Application aux ${targetDBs.length} autres bases\n`);

  for (const targetDB of targetDBs) {
    console.log(`🔄 Synchronisation de ${targetDB}...`);
    
    try {
      await connection.query(`USE \`${targetDB}\``);
      
      for (const [tableName, createSQL] of Object.entries(tableStructures)) {
        try {
          // Supprimer la table existante
          await connection.query(`DROP TABLE IF EXISTS \`${tableName}\``);
          
          // Recréer avec la structure complète
          await connection.query(createSQL);
          
          console.log(`   ✅ ${tableName} synchronisée`);
        } catch (error) {
          console.error(`   ❌ Erreur pour ${tableName}:`, error.message);
        }
      }
      
      console.log(`✅ ${targetDB} synchronisée!\n`);
      
    } catch (error) {
      console.error(`❌ Erreur pour ${targetDB}:`, error.message, '\n');
    }
  }

  await connection.end();
  
  console.log('🎉 Synchronisation terminée!');
  console.log('\n📊 Toutes vos bases ont maintenant la MÊME structure que 2025_bu01');
  console.log('\n💡 Prochaine étape:');
  console.log('   1. Rafraîchissez l\'interface web');
  console.log('   2. Toutes les migrations futures s\'appliqueront uniformément');
}

syncFromMaster().catch(console.error);
