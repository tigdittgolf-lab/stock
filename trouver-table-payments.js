/**
 * Script pour trouver dans quelle base se trouve la table payments
 */

import mysql from 'mysql2/promise';

async function findPaymentsTable() {
  console.log('🔍 Recherche de la table "payments" dans TOUTES les bases...\n');

  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: ''
  });

  // 1. Lister toutes les bases
  const [databases] = await connection.query('SHOW DATABASES');
  const userDatabases = databases
    .map(row => row.Database)
    .filter(db => !['information_schema', 'mysql', 'performance_schema', 'sys'].includes(db));

  console.log(`📊 ${userDatabases.length} base(s) de données trouvée(s):\n`);
  userDatabases.forEach(db => console.log(`   - ${db}`));
  console.log('\n');

  // 2. Chercher la table payments dans chaque base
  console.log('🔍 Recherche de la table "payments"...\n');

  let found = false;

  for (const dbName of userDatabases) {
    try {
      await connection.query(`USE \`${dbName}\``);
      const [tables] = await connection.query('SHOW TABLES');
      
      const hasPayments = tables.some(row => {
        const tableName = Object.values(row)[0];
        return tableName.toLowerCase() === 'payments';
      });

      if (hasPayments) {
        found = true;
        console.log(`✅ TROUVÉ dans: ${dbName}\n`);
        
        // Voir la structure
        const [structure] = await connection.query('DESCRIBE payments');
        console.log('   Structure de la table:\n');
        structure.forEach(col => {
          console.log(`      ${col.Field.padEnd(20)} ${col.Type}`);
        });
        
        // Compter les lignes
        const [count] = await connection.query('SELECT COUNT(*) as total FROM payments');
        console.log(`\n   📊 Nombre de lignes: ${count[0].total}\n`);
      }
    } catch (error) {
      // Ignorer les erreurs d'accès
    }
  }

  if (!found) {
    console.log('❌ Table "payments" introuvable dans aucune base de données\n');
    console.log('Bases vérifiées:');
    userDatabases.forEach(db => console.log(`   - ${db}`));
  }

  await connection.end();
}

findPaymentsTable().catch(console.error);
