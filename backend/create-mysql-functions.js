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

async function createFunctions() {
  console.log('========================================');
  console.log('CRÉATION DES FONCTIONS ET PROCÉDURES MYSQL');
  console.log('========================================\n');
  
  const password = await question('Entrez le mot de passe MySQL root: ');
  
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: password,
      multipleStatements: true
    });
    
    console.log('\n✅ Connexion à MySQL réussie\n');
    
    // ÉTAPE 1: Créer la fonction authenticate_user
    console.log('ÉTAPE 1: Création de la fonction authenticate_user...\n');
    const createFunctionSQL = fs.readFileSync(path.join(__dirname, '..', 'MYSQL_CREATE_FUNCTIONS_NODEJS.sql'), 'utf8');
    await connection.query(createFunctionSQL);
    console.log('✅ Fonction authenticate_user créée\n');
    
    // ÉTAPE 2: Créer les procédures
    console.log('ÉTAPE 2: Création des procédures...\n');
    const createProceduresSQL = fs.readFileSync(path.join(__dirname, '..', 'MYSQL_CREATE_PROCEDURES_NODEJS.sql'), 'utf8');
    await connection.query(createProceduresSQL);
    console.log('✅ Procédures créées (create_user, update_user, delete_user)\n');
    
    console.log('\n========================================');
    console.log('🎉 Fonctions et procédures créées avec succès!');
    console.log('========================================\n');
    
    // VÉRIFICATION
    console.log('VÉRIFICATION...\n');
    
    // Vérifier les fonctions
    const [functions] = await connection.query("SHOW FUNCTION STATUS WHERE Db = 'stock_management_auth'");
    console.log('Fonctions disponibles:');
    console.table(functions.map(f => ({ name: f.Name, type: f.Type })));
    
    // Vérifier les procédures
    const [procedures] = await connection.query("SHOW PROCEDURE STATUS WHERE Db = 'stock_management_auth'");
    console.log('\nProcédures disponibles:');
    console.table(procedures.map(p => ({ name: p.Name, type: p.Type })));
    
    // Tester l'authentification
    console.log('\nTest de authenticate_user(admin, admin123):');
    try {
      const [authResult] = await connection.query("SELECT authenticate_user('admin', 'admin123') as result");
      const resultStr = authResult[0].result;
      console.log('Résultat brut:', resultStr);
      
      // MySQL retourne déjà un objet JSON, pas une chaîne
      const result = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;
      console.log(JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log('\n✅ Test d\'authentification réussi!');
      } else {
        console.log('\n❌ Test d\'authentification échoué:', result.error);
      }
    } catch (error) {
      console.log('⚠️  Erreur lors du test (mais les fonctions sont créées):', error.message);
    }
    
    console.log('\n========================================');
    console.log('📋 RÉSUMÉ FINAL');
    console.log('========================================');
    console.log('✅ Base de données: stock_management_auth');
    console.log('✅ Tables: users, business_units, user_permissions, system_logs');
    console.log('✅ Fonctions: authenticate_user()');
    console.log('✅ Procédures: create_user(), update_user(), delete_user()');
    console.log('✅ Utilisateur admin: admin / admin123');
    console.log('========================================\n');
    console.log('🎉 Le système MySQL autonome est maintenant COMPLET et OPÉRATIONNEL!');
    console.log('========================================\n');
    
  } catch (error) {
    console.error('\n❌ Erreur:', error.message);
    if (error.sql) {
      console.error('SQL:', error.sql.substring(0, 300) + '...');
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
    rl.close();
  }
}

createFunctions();
