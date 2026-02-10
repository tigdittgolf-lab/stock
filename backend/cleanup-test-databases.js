// Supprimer les bases de test créées par erreur
import mysql from 'mysql2/promise';

async function cleanupTestDatabases() {
  console.log('🧹 Nettoyage des bases de test\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: ''
  });

  console.log('✅ Connecté à MySQL\n');

  // Bases de TEST à supprimer (créées par moi)
  const testDatabases = [
    '2024_bu01',
    '2024_bu02',
    '2025_bu02'
  ];

  console.log('⚠️  Bases de TEST qui seront supprimées:');
  testDatabases.forEach(db => console.log(`   - ${db}`));
  
  console.log('\n✅ Bases RÉELLES qui seront conservées:');
  console.log('   - 2009_bu02');
  console.log('   - 2025_bu01');
  console.log('   - 2026_bu01');
  console.log('   - 2099_bu02');

  console.log('\n🗑️  Suppression en cours...\n');

  for (const db of testDatabases) {
    try {
      await connection.query(`DROP DATABASE IF EXISTS \`${db}\``);
      console.log(`✅ Supprimée: ${db}`);
    } catch (error) {
      console.error(`❌ Erreur pour ${db}:`, error.message);
    }
  }

  await connection.end();
  
  console.log('\n🎉 Nettoyage terminé!');
  console.log('\n📊 Vos bases RÉELLES:');
  console.log('   1. 2009_bu02');
  console.log('   2. 2025_bu01');
  console.log('   3. 2026_bu01');
  console.log('   4. 2099_bu02');
}

cleanupTestDatabases().catch(console.error);
