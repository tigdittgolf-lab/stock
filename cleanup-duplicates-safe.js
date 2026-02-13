const mysql = require('mysql2/promise');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration MySQL
const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: ''
};

// Liste des bases de données à nettoyer
const databases = [
  '2009_bu02',
  '2025_bu02',
  '2099_bu02'
];

async function cleanupDuplicatesSafe() {
  let connection;
  
  try {
    connection = await mysql.createConnection(config);
    console.log('✅ Connecté à MySQL\n');

    for (const dbName of databases) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔧 Nettoyage de la base: ${dbName}`);
      console.log('='.repeat(60));

      // Vérifier si la base existe
      const [dbs] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);
      if (dbs.length === 0) {
        console.log(`⚠️  Base ${dbName} n'existe pas, ignorée`);
        continue;
      }

      await connection.query(`USE \`${dbName}\``);

      // 1. Nettoyer la table ARTICLE
      await cleanupTableSafe(connection, dbName, 'article', 'Narticle');

      // 2. Nettoyer la table CLIENT
      await cleanupTableSafe(connection, dbName, 'client', 'Nclient');

      // 3. Nettoyer la table FOURNISSEUR
      await cleanupTableSafe(connection, dbName, 'fournisseur', 'Nfournisseur');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Nettoyage terminé pour toutes les bases');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n✅ Connexion fermée');
    }
  }
}

async function cleanupTableSafe(connection, dbName, tableName, codeColumn) {
  console.log(`\n📦 Nettoyage table ${tableName.toUpperCase()}...`);
  
  try {
    // Vérifier si la table existe
    const [tables] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
    if (tables.length === 0) {
      console.log('   ⚠️  Table n\'existe pas');
      return;
    }

    // Compter avant
    const [countBefore] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`   📊 Enregistrements avant: ${countBefore[0].count}`);

    // 1. Supprimer les enregistrements avec code NULL ou vide
    const [deleteNull] = await connection.query(
      `DELETE FROM ${tableName} WHERE ${codeColumn} IS NULL OR ${codeColumn} = ''`
    );
    if (deleteNull.affectedRows > 0) {
      console.log(`   🗑️  Supprimés (code null/vide): ${deleteNull.affectedRows}`);
    }

    // 2. Identifier les doublons
    const [duplicates] = await connection.query(`
      SELECT ${codeColumn}, COUNT(*) as count 
      FROM ${tableName}
      GROUP BY ${codeColumn} 
      HAVING count > 1
    `);

    if (duplicates.length > 0) {
      console.log(`   🔍 Codes en double trouvés: ${duplicates.length}`);
      
      let totalDeleted = 0;
      
      // Pour chaque code en double, garder le premier et supprimer les autres
      for (const dup of duplicates) {
        const code = dup[codeColumn];
        
        // Récupérer tous les enregistrements avec ce code
        const [rows] = await connection.query(
          `SELECT * FROM ${tableName} WHERE ${codeColumn} = ?`,
          [code]
        );
        
        if (rows.length > 1) {
          // Identifier la première ligne (on va la garder)
          // Supprimer toutes les autres lignes
          
          // Créer une condition pour supprimer toutes sauf la première
          // On utilise une sous-requête pour identifier les lignes à supprimer
          const [result] = await connection.query(`
            DELETE FROM ${tableName}
            WHERE ${codeColumn} = ?
            AND NOT EXISTS (
              SELECT 1 FROM (
                SELECT MIN(CAST(${codeColumn} AS CHAR)) as min_code
                FROM ${tableName} t2
                WHERE t2.${codeColumn} = ${tableName}.${codeColumn}
                LIMIT 1
              ) as keeper
            )
            LIMIT ?
          `, [code, rows.length - 1]);
          
          // Alternative plus simple: supprimer en gardant un seul
          const deleteCount = rows.length - 1;
          for (let i = 0; i < deleteCount; i++) {
            await connection.query(
              `DELETE FROM ${tableName} WHERE ${codeColumn} = ? LIMIT 1`,
              [code]
            );
          }
          
          totalDeleted += deleteCount;
        }
      }
      
      console.log(`   🗑️  Doublons supprimés: ${totalDeleted}`);
    } else {
      console.log('   ✅ Aucun doublon trouvé');
    }

    // Compter après
    const [countAfter] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`   📊 Enregistrements après: ${countAfter[0].count}`);
    console.log(`   ✅ Total supprimés: ${countBefore[0].count - countAfter[0].count}`);

  } catch (error) {
    console.error(`   ❌ Erreur nettoyage ${tableName}: ${error.message}`);
  }
}

// Exécuter le nettoyage
cleanupDuplicatesSafe();
