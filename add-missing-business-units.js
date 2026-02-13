// Script pour ajouter les BU manquantes dans MySQL
import mysql from 'mysql2/promise';

async function addMissingBusinessUnits() {
  let connection;
  
  try {
    // Connexion à MySQL
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root',
      password: '',
      database: 'stock_management_auth'
    });

    console.log('✅ Connecté à MySQL');

    // Vérifier les BU existantes
    console.log('\n📊 BU existantes AVANT ajout:');
    const [existingBUs] = await connection.execute(
      'SELECT schema_name, bu_code, year, nom_entreprise, active FROM business_units ORDER BY year DESC, bu_code'
    );
    console.table(existingBUs);

    // Ajouter les BU manquantes
    console.log('\n➕ Ajout des BU manquantes...');
    
    const insertSQL = `
      INSERT INTO business_units (schema_name, bu_code, year, nom_entreprise, adresse, telephone, email, active, created_at, updated_at)
      VALUES 
        ('2009_bu02', 'BU02', 2009, 'ETS BENAMAR BOUZID MENOUAR - Archives 2009', 'Alger, Algérie', '021-123456', 'contact@benamar.dz', 1, NOW(), NOW()),
        ('2099_bu02', 'BU02', 2099, 'ETS BENAMAR BOUZID MENOUAR - Test/Demo', 'Alger, Algérie', '021-123456', 'contact@benamar.dz', 1, NOW(), NOW())
      ON DUPLICATE KEY UPDATE 
        nom_entreprise = VALUES(nom_entreprise),
        active = VALUES(active),
        updated_at = NOW()
    `;

    const [result] = await connection.execute(insertSQL);
    console.log(`✅ ${result.affectedRows} lignes affectées`);

    // Vérifier les BU après ajout
    console.log('\n📊 BU existantes APRÈS ajout:');
    const [allBUs] = await connection.execute(
      `SELECT 
        schema_name, 
        bu_code, 
        year, 
        nom_entreprise, 
        active,
        CASE 
          WHEN schema_name IN ('2009_bu02', '2024_bu01', '2025_bu01', '2025_bu02', '2026_bu01', '2099_bu02') 
          THEN 'Autorisée pour admin'
          ELSE 'Non autorisée'
        END as statut_admin
      FROM business_units 
      ORDER BY year DESC, bu_code`
    );
    console.table(allBUs);

    // Compter les BU actives
    const [count] = await connection.execute(
      'SELECT COUNT(*) as total_bu_actives FROM business_units WHERE active = 1'
    );
    console.log(`\n✅ Total BU actives: ${count[0].total_bu_actives}`);

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

addMissingBusinessUnits();
