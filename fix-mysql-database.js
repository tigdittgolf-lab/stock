const mysql = require('mysql2/promise');

async function setupMySQLDatabase() {
  console.log('🔧 Setting up MySQL database...');
  
  try {
    // Connect to MySQL server (without specifying database)
    const connection = await mysql.createConnection({
      host: 'localhost',
      port: 3307,
      user: 'root',
      password: ''
    });
    
    console.log('✅ Connected to MySQL server');
    
    // Create stock_management database if it doesn't exist
    await connection.execute('CREATE DATABASE IF NOT EXISTS stock_management');
    console.log('✅ Database stock_management created/verified');
    
    // Switch to the database
    await connection.execute('USE stock_management');
    
    // Create the tenant schema (2025_bu01)
    await connection.execute('CREATE SCHEMA IF NOT EXISTS `2025_bu01`');
    console.log('✅ Schema 2025_bu01 created/verified');
    
    // Create basic tables in the tenant schema
    const tables = [
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.article (
        narticle VARCHAR(50) PRIMARY KEY,
        famille VARCHAR(100),
        designation VARCHAR(255),
        nfournisseur VARCHAR(50),
        prix_unitaire DECIMAL(10,2),
        marge DECIMAL(5,2),
        tva DECIMAL(5,2),
        prix_vente DECIMAL(10,2),
        seuil INT,
        stock_f INT DEFAULT 0,
        stock_bl INT DEFAULT 0
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.fournisseur (
        nfournisseur VARCHAR(50) PRIMARY KEY,
        nom_fournisseur VARCHAR(255),
        resp_fournisseur VARCHAR(255),
        adresse_fourni TEXT,
        tel VARCHAR(50),
        tel1 VARCHAR(50),
        tel2 VARCHAR(50),
        caf DECIMAL(10,2),
        cabl DECIMAL(10,2),
        email VARCHAR(255),
        commentaire TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.client (
        nclient VARCHAR(50) PRIMARY KEY,
        nom_client VARCHAR(255),
        resp_client VARCHAR(255),
        adresse_client TEXT,
        tel VARCHAR(50),
        tel1 VARCHAR(50),
        tel2 VARCHAR(50),
        caf DECIMAL(10,2),
        cabl DECIMAL(10,2),
        email VARCHAR(255),
        commentaire TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.bl (
        nfact VARCHAR(50) PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        total_ht DECIMAL(10,2),
        total_ttc DECIMAL(10,2)
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.fact (
        nfact VARCHAR(50) PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        total_ht DECIMAL(10,2),
        total_ttc DECIMAL(10,2)
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.proforma (
        nfact VARCHAR(50) PRIMARY KEY,
        nclient VARCHAR(50),
        date_fact DATE,
        total_ht DECIMAL(10,2),
        total_ttc DECIMAL(10,2)
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.detail_bl (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nfact VARCHAR(50),
        narticle VARCHAR(50),
        qte INT,
        prix DECIMAL(10,2),
        total_ligne DECIMAL(10,2)
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.detail_fact (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nfact VARCHAR(50),
        narticle VARCHAR(50),
        qte INT,
        prix DECIMAL(10,2),
        total_ligne DECIMAL(10,2)
      )`,
      
      `CREATE TABLE IF NOT EXISTS \`2025_bu01\`.detail_proforma (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nfact VARCHAR(50),
        narticle VARCHAR(50),
        qte INT,
        prix DECIMAL(10,2),
        total_ligne DECIMAL(10,2)
      )`
    ];
    
    for (const tableSQL of tables) {
      await connection.execute(tableSQL);
    }
    
    console.log('✅ All tables created/verified');
    
    // Insert some sample data
    await connection.execute(`
      INSERT IGNORE INTO \`2025_bu01\`.article 
      (narticle, famille, designation, nfournisseur, prix_unitaire, marge, tva, prix_vente, seuil, stock_f, stock_bl)
      VALUES 
      ('ART001', 'Outils', 'Marteau', 'FOUR001', 15.00, 30.00, 19.00, 19.50, 10, 50, 45),
      ('ART002', 'Outils', 'Tournevis', 'FOUR001', 8.00, 25.00, 19.00, 10.00, 20, 100, 95),
      ('ART003', 'Matériel', 'Vis 6mm', 'FOUR002', 0.50, 100.00, 19.00, 1.00, 500, 2000, 1950)
    `);
    
    await connection.execute(`
      INSERT IGNORE INTO \`2025_bu01\`.fournisseur 
      (nfournisseur, nom_fournisseur, resp_fournisseur, adresse_fourni, tel, email)
      VALUES 
      ('FOUR001', 'Outillage Pro', 'M. Dupont', '123 Rue de l\'Industrie', '01.23.45.67.89', 'contact@outillage-pro.fr'),
      ('FOUR002', 'Visserie Express', 'Mme Martin', '456 Avenue des Métiers', '01.98.76.54.32', 'info@visserie-express.fr')
    `);
    
    await connection.execute(`
      INSERT IGNORE INTO \`2025_bu01\`.client 
      (nclient, nom_client, resp_client, adresse_client, tel, email)
      VALUES 
      ('CLI001', 'Entreprise ABC', 'M. Durand', '789 Boulevard Commercial', '01.11.22.33.44', 'contact@abc-entreprise.fr'),
      ('CLI002', 'Société XYZ', 'Mme Leroy', '321 Rue du Commerce', '01.55.66.77.88', 'info@xyz-societe.fr')
    `);
    
    console.log('✅ Sample data inserted');
    
    await connection.end();
    console.log('🎉 MySQL database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ MySQL setup failed:', error);
    process.exit(1);
  }
}

setupMySQLDatabase();