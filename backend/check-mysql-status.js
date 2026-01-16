import mysql from 'mysql2/promise';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function checkStatus() {
  console.log('========================================');
  console.log('VÉRIFICATION MYSQL');
  console.log('========================================\n');
  
  const password = await question('Entrez le mot de passe MySQL root: ');
  
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password
    });
    
    console.log('\n✅ Connexion à MySQL réussie\n');
    
    // Vérifier les tables dans stock_management_auth
    console.log('Tables dans stock_management_auth:');
    try {
      const [tables] = await connection.query('SHOW TABLES FROM stock_management_auth');
      if (tables.length > 0) {
        console.table(tables);
      } else {
        console.log('  Aucune table trouvée');
      }
    } catch (error) {
      console.log('  ❌ Base de données stock_management_auth n\'existe pas');
    }
    
    // Vérifier les tables dans 2025_bu01
    console.log('\nTables dans 2025_bu01:');
    try {
      const [tables] = await connection.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = '2025_bu01' AND TABLE_NAME IN ('users', 'business_units', 'user_permissions', 'system_logs')");
      if (tables.length > 0) {
        console.table(tables);
      } else {
        console.log('  Aucune table d\'authentification trouvée');
      }
    } catch (error) {
      console.log('  ❌ Erreur:', error.message);
    }
    
    // Vérifier les utilisateurs dans stock_management_auth
    console.log('\nUtilisateurs dans stock_management_auth:');
    try {
      const [users] = await connection.query('SELECT id, username, email, role, active FROM stock_management_auth.users');
      if (users.length > 0) {
        console.table(users);
      } else {
        console.log('  Aucun utilisateur trouvé');
      }
    } catch (error) {
      console.log('  ❌ Erreur:', error.message);
    }
    
    // Vérifier les fonctions
    console.log('\nFonctions dans stock_management_auth:');
    try {
      const [functions] = await connection.query("SHOW FUNCTION STATUS WHERE Db = 'stock_management_auth'");
      if (functions.length > 0) {
        console.table(functions.map(f => ({ name: f.Name, type: f.Type })));
      } else {
        console.log('  Aucune fonction trouvée');
      }
    } catch (error) {
      console.log('  ❌ Erreur:', error.message);
    }
    
    // Vérifier les procédures
    console.log('\nProcédures dans stock_management_auth:');
    try {
      const [procedures] = await connection.query("SHOW PROCEDURE STATUS WHERE Db = 'stock_management_auth'");
      if (procedures.length > 0) {
        console.table(procedures.map(p => ({ name: p.Name, type: p.Type })));
      } else {
        console.log('  Aucune procédure trouvée');
      }
    } catch (error) {
      console.log('  ❌ Erreur:', error.message);
    }
    
    // Tester l'authentification si la fonction existe
    console.log('\nTest de authenticate_user:');
    try {
      const [authResult] = await connection.query("SELECT authenticate_user('admin', 'admin123') as result");
      const result = JSON.parse(authResult[0].result);
      if (result.success) {
        console.log('  ✅ Authentification réussie!');
        console.log('  Utilisateur:', result.user);
      } else {
        console.log('  ❌ Authentification échouée:', result.error);
      }
    } catch (error) {
      console.log('  ❌ Fonction authenticate_user n\'existe pas ou erreur:', error.message);
    }
    
    console.log('\n========================================');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
  }
}

checkStatus();
