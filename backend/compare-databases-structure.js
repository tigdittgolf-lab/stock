// Comparer la structure de toutes vos bases
import mysql from 'mysql2/promise';

async function compareDatabases() {
  console.log('🔍 Analyse de la structure de vos bases\n');
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3307,
    user: 'root',
    password: ''
  });

  const databases = [
    '2009_bu02',
    '2024_bu01',
    '2025_bu01',
    '2025_bu02',
    '2026_bu01',
    '2099_bu02'
  ];

  const results = {};

  for (const db of databases) {
    try {
      await connection.query(`USE \`${db}\``);
      
      // Compter les tables
      const [tables] = await connection.query('SHOW TABLES');
      const tableCount = tables.length;
      
      // Lister les tables
      const tableNames = tables.map(row => Object.values(row)[0]);
      
      // Pour chaque table, compter les colonnes
      const tableDetails = {};
      for (const tableName of tableNames) {
        const [columns] = await connection.query(`DESCRIBE \`${tableName}\``);
        tableDetails[tableName] = {
          columns: columns.length,
          columnNames: columns.map(col => col.Field)
        };
      }
      
      results[db] = {
        tableCount,
        tables: tableNames,
        details: tableDetails
      };
      
    } catch (error) {
      console.error(`❌ Erreur pour ${db}:`, error.message);
      results[db] = { error: error.message };
    }
  }

  await connection.end();

  // Afficher les résultats
  console.log('📊 RÉSUMÉ:\n');
  console.log('Base de données       | Tables | Colonnes totales');
  console.log('---------------------|--------|------------------');
  
  for (const [db, info] of Object.entries(results)) {
    if (info.error) {
      console.log(`${db.padEnd(20)} | ERREUR`);
    } else {
      const totalColumns = Object.values(info.details).reduce((sum, t) => sum + t.columns, 0);
      console.log(`${db.padEnd(20)} | ${String(info.tableCount).padStart(6)} | ${String(totalColumns).padStart(16)}`);
    }
  }

  // Trouver la base la plus complète
  let mostComplete = null;
  let maxColumns = 0;
  
  for (const [db, info] of Object.entries(results)) {
    if (!info.error) {
      const totalColumns = Object.values(info.details).reduce((sum, t) => sum + t.columns, 0);
      if (totalColumns > maxColumns) {
        maxColumns = totalColumns;
        mostComplete = db;
      }
    }
  }

  console.log('\n🏆 BASE LA PLUS COMPLÈTE:', mostComplete);
  console.log(`   ${results[mostComplete].tableCount} tables, ${maxColumns} colonnes au total\n`);

  // Détails de la base la plus complète
  console.log('📋 Structure détaillée de', mostComplete, ':\n');
  for (const [table, details] of Object.entries(results[mostComplete].details)) {
    console.log(`   ${table} (${details.columns} colonnes):`);
    details.columnNames.forEach(col => console.log(`      - ${col}`));
    console.log('');
  }

  // Comparer avec les autres
  console.log('⚠️  DIFFÉRENCES avec les autres bases:\n');
  for (const [db, info] of Object.entries(results)) {
    if (db === mostComplete || info.error) continue;
    
    console.log(`📁 ${db}:`);
    
    // Tables manquantes
    const missingTables = results[mostComplete].tables.filter(t => !info.tables.includes(t));
    if (missingTables.length > 0) {
      console.log(`   ❌ Tables manquantes: ${missingTables.join(', ')}`);
    }
    
    // Colonnes manquantes par table
    for (const table of info.tables) {
      if (results[mostComplete].details[table]) {
        const refColumns = results[mostComplete].details[table].columnNames;
        const dbColumns = info.details[table].columnNames;
        const missingColumns = refColumns.filter(c => !dbColumns.includes(c));
        
        if (missingColumns.length > 0) {
          console.log(`   ⚠️  ${table}: colonnes manquantes: ${missingColumns.join(', ')}`);
        }
      }
    }
    console.log('');
  }
}

compareDatabases().catch(console.error);
