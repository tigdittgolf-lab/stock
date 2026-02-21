/**
 * Lister TOUTES les bases de données MySQL
 */

import mysql from 'mysql2/promise';

const mysqlConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: ''
};

async function main() {
  console.log('LISTE DE TOUTES LES BASES MYSQL\n');
  console.log('='.repeat(70));

  let mysqlConn;

  try {
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('Connexion MySQL OK\n');

    // Lister toutes les bases
    const [databases] = await mysqlConn.query('SHOW DATABASES');
    
    console.log(`Total: ${databases.length} bases de donnees\n`);

    // Filtrer les bases système
    const systemDatabases = ['information_schema', 'mysql', 'performance_schema', 'sys'];
    const userDatabases = databases
      .map(db => db.Database)
      .filter(name => !systemDatabases.includes(name));

    console.log('BASES SYSTEME:');
    systemDatabases.forEach(db => {
      if (databases.find(d => d.Database === db)) {
        console.log(`  - ${db}`);
      }
    });

    console.log(`\nBASES UTILISATEUR (${userDatabases.length}):`);
    userDatabases.forEach(db => {
      console.log(`  - ${db}`);
    });

    // Identifier les bases tenant (pattern: YYYY_buXX)
    const tenantPattern = /^\d{4}_bu\d{2}$/;
    const tenantDatabases = userDatabases.filter(name => tenantPattern.test(name));

    console.log(`\nBASES TENANT (${tenantDatabases.length}):`);
    tenantDatabases.forEach(db => {
      console.log(`  - ${db}`);
    });

    // Autres bases
    const otherDatabases = userDatabases.filter(name => !tenantPattern.test(name));
    if (otherDatabases.length > 0) {
      console.log(`\nAUTRES BASES (${otherDatabases.length}):`);
      otherDatabases.forEach(db => {
        console.log(`  - ${db}`);
      });
    }

    console.log('\n' + '='.repeat(70));
    console.log('\nRECOMMANDATION:');
    console.log(`Migrer les ${tenantDatabases.length} bases tenant vers Supabase`);
    
    if (tenantDatabases.length > 0) {
      console.log('\nListe pour migrate-all-databases.js:');
      console.log(`const databasesToMigrate = ${JSON.stringify(tenantDatabases, null, 2)};`);
    }

  } catch (error) {
    console.error('ERREUR:', error.message);
  } finally {
    if (mysqlConn) {
      await mysqlConn.end();
    }
  }
}

main();
