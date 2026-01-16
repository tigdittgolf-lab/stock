import mysql from 'mysql2/promise';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    
    // ÉTAPE 1: Déplacer les tables
    console.log('ÉTAPE 1: Déplacement des tables...\n');
    const moveTablesSQL = fs.readFileSync(path.join(__dirname, '..', 'MYSQL_MOVE_TABLES_NODEJS.sql'), 'utf8');
    await connection.query(moveTablesSQL);
    console.log('✅ Tables déplacées vers stock_management_auth\n');
    
    // ÉTAPE 2: Créer la fonction authenticate_user
    console.log('ÉTAPE 2: Création de la fonction authenticate_user...\n');
    const createFunctionSQL = fs.readFileSync(path.join(__dirname, '..', 'MYSQL_CREATE_FUNCTIONS_NODEJS.sql'), 'utf8');
    await connection.query(createFunctionSQL);
    console.log('✅ Fonction authenticate_user créée\n');
    
    // ÉTAPE 3: Créer les procédures
    console.log('ÉTAPE 3: Création des procédures...\n');
    const createProceduresSQL = fs.readFileSync(path.join(__dirname, '..', 'MYSQL_CREATE_PROCEDURES_NODEJS.sql'), 'utf8');
    await connection.query(createProceduresSQL);
    console.log('✅ Procédures créées (create_user, update_user, delete_user)\n');
    
    console.log('\n========================================');
    console.log('🎉 Migration terminée avec succès!');
    console.log('========================================\n');
    
    // VÉRIFICATION
    console.log('VÉRIFICATION DU SYSTÈME...\n');
    
    // Vérifier les tables
    const [tables] = await connection.query('SHOW TABLES FROM stock_management_auth');
    console.log('Tables dans stock_management_auth:');
    console.table(tables);
    
    // Vérifier les utilisateurs
    const [users] = await connection.query('SELECT id, username, email, role, active FROM stock_management_auth.users');
    console.log('\nUtilisateurs:');
    console.table(users);
    
    // Vérifier les fonctions
    const [functions] = await connection.query("SHOW FUNCTION STATUS WHERE Db = 'stock_management_auth'");
    console.log('\nFonctions disponibles:');
    console.table(functions.map(f => ({ name: f.Name, type: f.Type })));
    
    // Vérifier les procédures
    const [procedures] = await connection.query("SHOW PROCEDURE STATUS WHERE Db = 'stock_management_auth'");
    console.log('\nProcédures disponibles:');
    console.table(procedures.map(p => ({ name: p.Name, type: p.Type })));
    
    // Tester l'authentification
    console.log('\nTest de authenticate_user(admin, admin123):');
    const [authResult] = await connection.query("SELECT authenticate_user('admin', 'admin123') as result");
    console.log(JSON.parse(authResult[0].result));
    
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
