// Créer les bases manquantes
import mysql from 'mysql2/promise';

async function createMissingDatabases() {
  console.log('🔧 Création des bases manquantes\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: ''
  });

  console.log('✅ Connecté à MySQL\n');

  // Bases à créer
  const databases = [
    '2009_bu02',
    '2026_bu01',
    '2099_bu02'
  ];

  for (const db of databases) {
    try {
      // Créer la base
      await connection.query(`CREATE DATABASE IF NOT EXISTS \`${db}\``);
      console.log(`✅ Base créée: ${db}`);

      // Copier la structure standard
      await connection.query(`USE \`${db}\``);
      
      // Tables principales
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

      console.log(`   📋 Tables créées dans ${db}\n`);

    } catch (error) {
      console.error(`❌ Erreur pour ${db}:`, error.message);
    }
  }

  await connection.end();
  
  console.log('\n🎉 Terminé! Vous avez maintenant 7 bases:');
  console.log('   - 2009_bu02 ✅');
  console.log('   - 2024_bu01');
  console.log('   - 2024_bu02');
  console.log('   - 2025_bu01');
  console.log('   - 2025_bu02');
  console.log('   - 2026_bu01 ✅');
  console.log('   - 2099_bu02 ✅');
  console.log('\n💡 Rafraîchissez l\'interface web pour les voir!');
}

createMissingDatabases().catch(console.error);
