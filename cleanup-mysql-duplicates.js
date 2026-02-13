const mysql = require('mysql2/promise');

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
  '2024_bu01', 
  '2025_bu01',
  '2025_bu02',
  '2026_bu01',
  '2099_bu02'
];

async function cleanupDatabase() {
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
      await cleanupArticles(connection, dbName);

      // 2. Nettoyer la table CLIENT
      await cleanupClients(connection, dbName);

      // 3. Nettoyer la table FOURNISSEUR
      await cleanupFournisseurs(connection, dbName);
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

async function cleanupArticles(connection, dbName) {
  console.log('\n📦 Nettoyage table ARTICLE...');
  
  try {
    // Vérifier si la table existe
    const [tables] = await connection.query(`SHOW TABLES LIKE 'article'`);
    if (tables.length === 0) {
      console.log('   ⚠️  Table article n\'existe pas');
      return;
    }

    // Vérifier les colonnes disponibles
    const [columns] = await connection.query(`SHOW COLUMNS FROM article`);
    const columnNames = columns.map(col => col.Field.toLowerCase());
    
    // Déterminer le nom de la colonne code
    let codeColumn = null;
    if (columnNames.includes('narticle')) codeColumn = 'Narticle';
    else if (columnNames.includes('code_article')) codeColumn = 'code_article';
    else if (columnNames.includes('code')) codeColumn = 'code';
    
    if (!codeColumn) {
      console.log('   ⚠️  Colonne code article non trouvée');
      return;
    }

    // Compter les enregistrements avant nettoyage
    const [countBefore] = await connection.query(`SELECT COUNT(*) as count FROM article`);
    console.log(`   📊 Articles avant nettoyage: ${countBefore[0].count}`);

    // 1. Supprimer les enregistrements avec code NULL ou vide
    const [deleteNull] = await connection.query(
      `DELETE FROM article WHERE ${codeColumn} IS NULL OR ${codeColumn} = ''`
    );
    console.log(`   🗑️  Supprimés (code null/vide): ${deleteNull.affectedRows}`);

    // 2. Créer une table temporaire avec les enregistrements uniques
    await connection.query(`DROP TABLE IF EXISTS article_temp`);
    
    await connection.query(`
      CREATE TABLE article_temp AS
      SELECT * FROM article
      WHERE ${codeColumn} IN (
        SELECT MIN(${codeColumn}) as ${codeColumn}
        FROM (
          SELECT ${codeColumn}, MIN(${codeColumn}) as min_code
          FROM article
          GROUP BY ${codeColumn}
        ) as subquery
      )
      GROUP BY ${codeColumn}
    `);

    // Compter les doublons
    const [countTemp] = await connection.query(`SELECT COUNT(*) as count FROM article_temp`);
    const duplicatesRemoved = countBefore[0].count - deleteNull.affectedRows - countTemp[0].count;
    
    if (duplicatesRemoved > 0) {
      console.log(`   🔍 Doublons trouvés et supprimés: ${duplicatesRemoved}`);
      
      // Remplacer la table originale
      await connection.query(`DROP TABLE article`);
      await connection.query(`RENAME TABLE article_temp TO article`);
    } else {
      console.log('   ✅ Aucun doublon trouvé');
      await connection.query(`DROP TABLE IF EXISTS article_temp`);
    }

    // Compter après nettoyage
    const [countAfter] = await connection.query(`SELECT COUNT(*) as count FROM article`);
    console.log(`   📊 Articles après nettoyage: ${countAfter[0].count}`);
    console.log(`   ✅ Total supprimés: ${countBefore[0].count - countAfter[0].count}`);

  } catch (error) {
    console.error(`   ❌ Erreur nettoyage articles: ${error.message}`);
    // Nettoyer la table temporaire en cas d'erreur
    try {
      await connection.query(`DROP TABLE IF EXISTS article_temp`);
    } catch (e) {}
  }
}

async function cleanupClients(connection, dbName) {
  console.log('\n👥 Nettoyage table CLIENT...');
  
  try {
    // Vérifier si la table existe
    const [tables] = await connection.query(`SHOW TABLES LIKE 'client'`);
    if (tables.length === 0) {
      console.log('   ⚠️  Table client n\'existe pas');
      return;
    }

    // Vérifier les colonnes disponibles
    const [columns] = await connection.query(`SHOW COLUMNS FROM client`);
    const columnNames = columns.map(col => col.Field.toLowerCase());
    
    // Déterminer le nom de la colonne code
    let codeColumn = null;
    if (columnNames.includes('nclient')) codeColumn = 'Nclient';
    else if (columnNames.includes('code_client')) codeColumn = 'code_client';
    else if (columnNames.includes('code')) codeColumn = 'code';
    
    if (!codeColumn) {
      console.log('   ⚠️  Colonne code client non trouvée');
      return;
    }

    // Compter avant
    const [countBefore] = await connection.query(`SELECT COUNT(*) as count FROM client`);
    console.log(`   📊 Clients avant nettoyage: ${countBefore[0].count}`);

    // Supprimer NULL/vide
    const [deleteNull] = await connection.query(
      `DELETE FROM client WHERE ${codeColumn} IS NULL OR ${codeColumn} = ''`
    );
    console.log(`   🗑️  Supprimés (code null/vide): ${deleteNull.affectedRows}`);

    // Créer table temporaire sans doublons
    await connection.query(`DROP TABLE IF EXISTS client_temp`);
    
    await connection.query(`
      CREATE TABLE client_temp AS
      SELECT * FROM client
      WHERE ${codeColumn} IN (
        SELECT MIN(${codeColumn}) as ${codeColumn}
        FROM (
          SELECT ${codeColumn}
          FROM client
          GROUP BY ${codeColumn}
        ) as subquery
      )
      GROUP BY ${codeColumn}
    `);

    const [countTemp] = await connection.query(`SELECT COUNT(*) as count FROM client_temp`);
    const duplicatesRemoved = countBefore[0].count - deleteNull.affectedRows - countTemp[0].count;
    
    if (duplicatesRemoved > 0) {
      console.log(`   🔍 Doublons supprimés: ${duplicatesRemoved}`);
      await connection.query(`DROP TABLE client`);
      await connection.query(`RENAME TABLE client_temp TO client`);
    } else {
      console.log('   ✅ Aucun doublon trouvé');
      await connection.query(`DROP TABLE IF EXISTS client_temp`);
    }

    // Compter après
    const [countAfter] = await connection.query(`SELECT COUNT(*) as count FROM client`);
    console.log(`   📊 Clients après nettoyage: ${countAfter[0].count}`);
    console.log(`   ✅ Total supprimés: ${countBefore[0].count - countAfter[0].count}`);

  } catch (error) {
    console.error(`   ❌ Erreur nettoyage clients: ${error.message}`);
    try {
      await connection.query(`DROP TABLE IF EXISTS client_temp`);
    } catch (e) {}
  }
}

async function cleanupFournisseurs(connection, dbName) {
  console.log('\n🏭 Nettoyage table FOURNISSEUR...');
  
  try {
    // Vérifier si la table existe
    const [tables] = await connection.query(`SHOW TABLES LIKE 'fournisseur'`);
    if (tables.length === 0) {
      console.log('   ⚠️  Table fournisseur n\'existe pas');
      return;
    }

    // Vérifier les colonnes disponibles
    const [columns] = await connection.query(`SHOW COLUMNS FROM fournisseur`);
    const columnNames = columns.map(col => col.Field.toLowerCase());
    
    // Déterminer le nom de la colonne code
    let codeColumn = null;
    if (columnNames.includes('nfournisseur')) codeColumn = 'Nfournisseur';
    else if (columnNames.includes('code_fournisseur')) codeColumn = 'code_fournisseur';
    else if (columnNames.includes('code')) codeColumn = 'code';
    
    if (!codeColumn) {
      console.log('   ⚠️  Colonne code fournisseur non trouvée');
      return;
    }

    // Compter avant
    const [countBefore] = await connection.query(`SELECT COUNT(*) as count FROM fournisseur`);
    console.log(`   📊 Fournisseurs avant nettoyage: ${countBefore[0].count}`);

    // Supprimer NULL/vide
    const [deleteNull] = await connection.query(
      `DELETE FROM fournisseur WHERE ${codeColumn} IS NULL OR ${codeColumn} = ''`
    );
    console.log(`   🗑️  Supprimés (code null/vide): ${deleteNull.affectedRows}`);

    // Créer table temporaire sans doublons
    await connection.query(`DROP TABLE IF EXISTS fournisseur_temp`);
    
    await connection.query(`
      CREATE TABLE fournisseur_temp AS
      SELECT * FROM fournisseur
      WHERE ${codeColumn} IN (
        SELECT MIN(${codeColumn}) as ${codeColumn}
        FROM (
          SELECT ${codeColumn}
          FROM fournisseur
          GROUP BY ${codeColumn}
        ) as subquery
      )
      GROUP BY ${codeColumn}
    `);

    const [countTemp] = await connection.query(`SELECT COUNT(*) as count FROM fournisseur_temp`);
    const duplicatesRemoved = countBefore[0].count - deleteNull.affectedRows - countTemp[0].count;
    
    if (duplicatesRemoved > 0) {
      console.log(`   🔍 Doublons supprimés: ${duplicatesRemoved}`);
      await connection.query(`DROP TABLE fournisseur`);
      await connection.query(`RENAME TABLE fournisseur_temp TO fournisseur`);
    } else {
      console.log('   ✅ Aucun doublon trouvé');
      await connection.query(`DROP TABLE IF EXISTS fournisseur_temp`);
    }

    // Compter après
    const [countAfter] = await connection.query(`SELECT COUNT(*) as count FROM fournisseur`);
    console.log(`   📊 Fournisseurs après nettoyage: ${countAfter[0].count}`);
    console.log(`   ✅ Total supprimés: ${countBefore[0].count - countAfter[0].count}`);

  } catch (error) {
    console.error(`   ❌ Erreur nettoyage fournisseurs: ${error.message}`);
    try {
      await connection.query(`DROP TABLE IF EXISTS fournisseur_temp`);
    } catch (e) {}
  }
}

// Exécuter le nettoyage
cleanupDatabase();
