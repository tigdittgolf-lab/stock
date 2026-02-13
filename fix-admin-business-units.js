// Script pour corriger le champ business_units de l'utilisateur admin
import mysql from 'mysql2/promise';

async function fixAdminBusinessUnits() {
  let connection;
  
  try {
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'stock_management_auth'
    });

    console.log('✅ Connecté à MySQL\n');

    // 1. Vérifier l'état actuel
    console.log('📊 ÉTAT ACTUEL:');
    const [currentUser] = await connection.execute(
      `SELECT id, username, email, role, business_units FROM users WHERE username = 'admin'`
    );
    
    if (currentUser.length === 0) {
      console.log('❌ Utilisateur admin non trouvé!');
      return;
    }

    console.log('Utilisateur:', currentUser[0].username);
    console.log('business_units actuel:', currentUser[0].business_units);
    console.log('Type:', typeof currentUser[0].business_units);

    // 2. Mettre à jour avec le bon format JSON
    const businessUnitsArray = ['2009_bu02', '2024_bu01', '2025_bu01', '2025_bu02', '2026_bu01', '2099_bu02'];
    const businessUnitsJSON = JSON.stringify(businessUnitsArray);

    console.log('\n➕ MISE À JOUR:');
    console.log('Nouveau business_units:', businessUnitsJSON);

    const [result] = await connection.execute(
      `UPDATE users SET business_units = ? WHERE username = 'admin'`,
      [businessUnitsJSON]
    );

    console.log(`✅ ${result.affectedRows} ligne(s) mise(s) à jour`);

    // 3. Vérifier après mise à jour
    console.log('\n📊 ÉTAT APRÈS MISE À JOUR:');
    const [updatedUser] = await connection.execute(
      `SELECT id, username, email, role, business_units FROM users WHERE username = 'admin'`
    );

    console.log('business_units:', updatedUser[0].business_units);
    
    // Tester le parsing
    try {
      const parsed = JSON.parse(updatedUser[0].business_units);
      console.log('✅ Format JSON valide!');
      console.log('BU autorisées:', parsed);
      console.log(`Total: ${parsed.length} BU`);
    } catch (e) {
      console.log('❌ Format JSON invalide:', e.message);
    }

  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

fixAdminBusinessUnits();
