const mysql = require('mysql2/promise');
const fs = require('fs');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function executeMigration() {
  console.log('========================================');
  console.log('MIGRATION MYSQL');
  console.log('========================================\n');
  
  const password = await question('Entrez le mot de passe MySQL root: ');
  
  let connection;
  
  try {
    // Connexion à MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      multipleStatements: true
    });
    
    console.log('\n✅ Connexion à MySQL réussie\n');
    
    // Lire le script de migration
    const migrationSQL = fs.readFileSync('MYSQL_MOVE_TABLES_FROM_2025_BU01.sql', 'utf8');
    
    console.log('Exécution de la migration...\n');
    
    // Exécuter le script
    const [results] = await connection.query(migrationSQL);
    
    console.log('✅ Migration exécutée avec succès!\n');
    
    // Afficher les résultats
    if (Array.isArray(results)) {
      results.forEach((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          console.log(`Résultat ${index + 1}:`);
          console.table(result);
        }
      });
    }
    
    console.log('\n========================================');
    console.log('🎉 Migration terminée avec succès!');
    console.log('========================================\n');
    
    // Maintenant exécuter la vérification
    console.log('Exécution de la vérification...\n');
    
    const verifySQL = fs.readFileSync('verify-mysql-setup.sql', 'utf8');
    const [verifyResults] = await connection.query(verifySQL);
    
    console.log('✅ Vérification terminée!\n');
    
    // Afficher les résultats de vérification
    if (Array.isArray(verifyResults)) {
      verifyResults.forEach((result, index) => {
        if (Array.isArray(result) && result.length > 0) {
          console.log(`Vérification ${index + 1}:`);
          console.table(result);
        }
      });
    }
    
    console.log('\n========================================');
    console.log('📋 RÉSUMÉ');
    console.log('========================================');
    console.log('✅ Base de données: stock_management_auth');
    console.log('✅ Tables: users, business_units, user_permissions, system_logs');
    console.log('✅ Fonctions: authenticate_user()');
    console.log('✅ Procédures: create_user(), update_user(), delete_user()');
    console.log('✅ Utilisateur admin: admin / admin123');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 200) + '...');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
  }
}

executeMigration();
