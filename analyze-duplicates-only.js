const mysql = require('mysql2/promise');

// Configuration MySQL
const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: ''
};

// Liste des bases de données à analyser
const databases = [
  '2009_bu02',
  '2024_bu01', 
  '2025_bu01',
  '2025_bu02',
  '2026_bu01',
  '2099_bu02'
];

async function analyzeDuplicates() {
  let connection;
  
  try {
    // Forcer une nouvelle connexion fraîche
    connection = await mysql.createConnection({
      ...config,
      connectTimeout: 10000
    });
    console.log('✅ Connecté à MySQL\n');

    for (const dbName of databases) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`🔍 Analyse de la base: ${dbName}`);
      console.log('='.repeat(60));

      // Vérifier si la base existe
      const [dbs] = await connection.query(`SHOW DATABASES LIKE '${dbName}'`);
      if (dbs.length === 0) {
        console.log(`⚠️  Base ${dbName} n'existe pas, ignorée`);
        continue;
      }

      // Utiliser la base
      await connection.query(`USE \`${dbName}\``);
      
      // Forcer un refresh de la connexion
      await connection.query('SELECT 1');

      // Analyser chaque table
      await analyzeTable(connection, 'article', 'Narticle');
      await analyzeTable(connection, 'client', 'Nclient');
      await analyzeTable(connection, 'fournisseur', 'Nfournisseur');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Analyse terminée');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function analyzeTable(connection, tableName, codeColumn) {
  console.log(`\n📊 Table: ${tableName.toUpperCase()}`);
  
  try {
    // Vérifier si la table existe
    const [tables] = await connection.query(`SHOW TABLES LIKE '${tableName}'`);
    if (tables.length === 0) {
      console.log(`   ⚠️  Table ${tableName} n'existe pas`);
      return;
    }

    // Compter total
    const [countTotal] = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    console.log(`   📈 Total enregistrements: ${countTotal[0].count}`);

    // Compter NULL/vide
    const [countNull] = await connection.query(
      `SELECT COUNT(*) as count FROM ${tableName} WHERE ${codeColumn} IS NULL OR ${codeColumn} = ''`
    );
    if (countNull[0].count > 0) {
      console.log(`   ⚠️  Codes NULL/vide: ${countNull[0].count}`);
    }

    // Identifier les doublons
    const [duplicates] = await connection.query(`
      SELECT ${codeColumn}, COUNT(*) as count 
      FROM ${tableName}
      WHERE ${codeColumn} IS NOT NULL AND ${codeColumn} != ''
      GROUP BY ${codeColumn} 
      HAVING count > 1
      ORDER BY count DESC
      LIMIT 10
    `);

    if (duplicates.length > 0) {
      console.log(`   🔍 Codes en double: ${duplicates.length} codes différents`);
      console.log(`   📋 Top 10 doublons:`);
      duplicates.forEach(dup => {
        console.log(`      - ${dup[codeColumn]}: ${dup.count} fois`);
      });
      
      // Compter le total de lignes en double
      const [totalDups] = await connection.query(`
        SELECT SUM(count - 1) as total_duplicates
        FROM (
          SELECT ${codeColumn}, COUNT(*) as count 
          FROM ${tableName}
          WHERE ${codeColumn} IS NOT NULL AND ${codeColumn} != ''
          GROUP BY ${codeColumn} 
          HAVING count > 1
        ) as dup_counts
      `);
      console.log(`   🗑️  Lignes en double à supprimer: ${totalDups[0].total_duplicates || 0}`);
    } else {
      console.log(`   ✅ Aucun doublon trouvé`);
    }

    // Compter les codes uniques
    const [countUnique] = await connection.query(
      `SELECT COUNT(DISTINCT ${codeColumn}) as count FROM ${tableName} WHERE ${codeColumn} IS NOT NULL AND ${codeColumn} != ''`
    );
    console.log(`   ✨ Codes uniques: ${countUnique[0].count}`);

  } catch (error) {
    console.error(`   ❌ Erreur analyse ${tableName}: ${error.message}`);
  }
}

// Exécuter l'analyse
analyzeDuplicates();
