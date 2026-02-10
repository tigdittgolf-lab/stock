// Comparer les fonctions et procédures stockées
import mysql from 'mysql2/promise';

async function compareFunctionsAndProcedures() {
  console.log('🔍 Analyse des fonctions et procédures stockées\n');
  
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
      
      // Lister les procédures
      const [procedures] = await connection.query(
        `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
         WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'`,
        [db]
      );
      
      // Lister les fonctions
      const [functions] = await connection.query(
        `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
         WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'`,
        [db]
      );
      
      results[db] = {
        procedures: procedures.map(p => p.ROUTINE_NAME),
        functions: functions.map(f => f.ROUTINE_NAME),
        procedureCount: procedures.length,
        functionCount: functions.length
      };
      
    } catch (error) {
      console.error(`❌ Erreur pour ${db}:`, error.message);
      results[db] = { error: error.message };
    }
  }

  await connection.end();

  // Afficher les résultats
  console.log('📊 RÉSUMÉ:\n');
  console.log('Base de données       | Procédures | Fonctions');
  console.log('---------------------|------------|----------');
  
  for (const [db, info] of Object.entries(results)) {
    if (info.error) {
      console.log(`${db.padEnd(20)} | ERREUR`);
    } else {
      console.log(`${db.padEnd(20)} | ${String(info.procedureCount).padStart(10)} | ${String(info.functionCount).padStart(9)}`);
    }
  }

  // Trouver la base avec le plus de routines
  let mostComplete = null;
  let maxRoutines = 0;
  
  for (const [db, info] of Object.entries(results)) {
    if (!info.error) {
      const total = info.procedureCount + info.functionCount;
      if (total > maxRoutines) {
        maxRoutines = total;
        mostComplete = db;
      }
    }
  }

  console.log('\n🏆 BASE AVEC LE PLUS DE ROUTINES:', mostComplete);
  console.log(`   ${results[mostComplete].procedureCount} procédures + ${results[mostComplete].functionCount} fonctions\n`);

  // Détails de la base la plus complète
  if (results[mostComplete].procedureCount > 0) {
    console.log('📋 Procédures dans', mostComplete, ':\n');
    results[mostComplete].procedures.forEach(proc => console.log(`   - ${proc}`));
    console.log('');
  }

  if (results[mostComplete].functionCount > 0) {
    console.log('📋 Fonctions dans', mostComplete, ':\n');
    results[mostComplete].functions.forEach(func => console.log(`   - ${func}`));
    console.log('');
  }

  // Comparer avec les autres
  console.log('⚠️  DIFFÉRENCES avec les autres bases:\n');
  for (const [db, info] of Object.entries(results)) {
    if (db === mostComplete || info.error) continue;
    
    console.log(`📁 ${db}:`);
    
    // Procédures manquantes
    const missingProcs = results[mostComplete].procedures.filter(p => !info.procedures.includes(p));
    if (missingProcs.length > 0) {
      console.log(`   ❌ Procédures manquantes (${missingProcs.length}): ${missingProcs.join(', ')}`);
    }
    
    // Fonctions manquantes
    const missingFuncs = results[mostComplete].functions.filter(f => !info.functions.includes(f));
    if (missingFuncs.length > 0) {
      console.log(`   ❌ Fonctions manquantes (${missingFuncs.length}): ${missingFuncs.join(', ')}`);
    }
    
    if (missingProcs.length === 0 && missingFuncs.length === 0) {
      console.log(`   ✅ Identique`);
    }
    console.log('');
  }
}

compareFunctionsAndProcedures().catch(console.error);
