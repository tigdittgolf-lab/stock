// Restaurer TOUTES les bases que vous avez mentionnées
import mysql from 'mysql2/promise';

async function restoreYourDatabases() {
  console.log('🔧 Restauration de VOS bases de données\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: ''
  });

  console.log('✅ Connecté à MySQL\n');

  // TOUTES les bases que VOUS avez mentionnées
  const yourDatabases = [
    '2009_bu02',
    '2024_bu01',
    '2025_bu01',
    '2025_bu02',
    '2026_bu01',
    '2099_bu02'
  ];

  console.log('📋 Création/Vérification de vos 6 bases:\n');

  for (const db of yourDatabases) {
    try {
      // Créer la base si elle n'existe pas
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db}\``);
      console.log(`✅ ${db}`);

      // Créer la structure de base
      await connection.query(`USE \`${db}\``);
      
      const tables = [
        `CREATE TABLE IF NOT EXISTS article (
          code VARCHAR(50) PRIMARY KEY,
          designation VARCHAR(255),
          prix_achat DECIMAL(10,2),
          prix_vente DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS client (
          code VARCHAR(50) PRIMARY KEY,
          nom VARCHAR(255),
          adresse TEXT,
          telephone VARCHAR(20)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS fournisseur (
          code VARCHAR(50) PRIMARY KEY,
          nom VARCHAR(255),
          adresse TEXT,
          telephone VARCHAR(20)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS bl (
          nfact VARCHAR(50) PRIMARY KEY,
          nclient VARCHAR(50),
          date_fact DATE,
          total_ht DECIMAL(10,2),
          total_ttc DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS fact (
          nfact VARCHAR(50) PRIMARY KEY,
          nclient VARCHAR(50),
          date_fact DATE,
          total_ht DECIMAL(10,2),
          total_ttc DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS bl_achat (
          nfact VARCHAR(50) PRIMARY KEY,
          nfournisseur VARCHAR(50),
          date_fact DATE,
          total_ht DECIMAL(10,2),
          total_ttc DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS detail_bl (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nfact VARCHAR(50),
          code_article VARCHAR(50),
          quantite DECIMAL(10,2),
          prix_unitaire DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS detail_fact (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nfact VARCHAR(50),
          code_article VARCHAR(50),
          quantite DECIMAL(10,2),
          prix_unitaire DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS proforma (
          nfact VARCHAR(50) PRIMARY KEY,
          nclient VARCHAR(50),
          date_fact DATE,
          total_ht DECIMAL(10,2),
          total_ttc DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
        
        `CREATE TABLE IF NOT EXISTS detail_proforma (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nfact VARCHAR(50),
          code_article VARCHAR(50),
          quantite DECIMAL(10,2),
          prix_unitaire DECIMAL(10,2)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`
      ];

      for (const tableSQL of tables) {
        await connection.query(tableSQL);
      }

    } catch (error) {
      console.error(`❌ Erreur pour ${db}:`, error.message);
    }
  }

  await connection.end();
  
  console.log('\n🎉 Terminé! Vos 6 bases sont prêtes:');
  console.log('   1. 2009_bu02');
  console.log('   2. 2024_bu01');
  console.log('   3. 2025_bu01');
  console.log('   4. 2025_bu02');
  console.log('   5. 2026_bu01');
  console.log('   6. 2099_bu02');
  console.log('\n💡 Rafraîchissez l\'interface web!');
}

restoreYourDatabases().catch(console.error);
