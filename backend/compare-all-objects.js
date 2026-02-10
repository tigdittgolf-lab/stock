// Comparer TOUS les objets de base de données
import mysql from 'mysql2/promise';

async function compareAllObjects() {
  console.log('🔍 Analyse complète de tous les objets\n');
  
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
      
      // Tables
      const [tables] = await connection.query('SHOW TABLES');
      
      // Vues
      const [views] = await connection.query('SHOW FULL TABLES WHERE Table_type = "VIEW"');
      
      // Triggers
      const [triggers] = await connection.query('SHOW TRIGGERS');
      
      // Procédures
      const [procedures] = await connection.query('SHOW PROCEDURE STATUS WHERE Db = ?', [db]);
      
      // Fonctions
      const [functions] = await connection.query('SHOW FUNCTION STATUS WHERE Db = ?', [db]);
      
      // Events
      const [events] = await connection.query('SHOW EVENTS');
      
      results[db] = {
        tables: tables.length,
        views: views.length,
        viewNames: views.map(v => Object.values(v)[0]),
        triggers: triggers.length,
        triggerNames: triggers.map(t => t.Trigger),
        procedures: procedures.length,
        procedureNames: procedures.map(p => p.Name),
        functions: functions.length,
        functionNames: functions.map(f => f.Name),
        events: events.length,
        eventNames: events.map(e => e.Name)
      };
      
    } catch (error) {
      console.error(`❌ Erreur pour ${db}:`, error.message);
      results[db] = { error: error.message };
    }
  }

  await connection.end();

  // Afficher les résultats
  console.log('📊 RÉSUMÉ COMPLET:\n');
  console.log('Base          | Tables | Vues | Triggers | Procédures | Fonctions | Events');
  console.log('--------------|--------|------|----------|------------|-----------|-------');
  
  for (const [db, info] of Object.entries(results)) {
    if (info.error) {
      console.log(`${db.padEnd(13)} | ERREUR`);
    } else {
      console.log(
        `${db.padEnd(13)} | ` +
        `${String(info.tables).padStart(6)} | ` +
        `${String(info.views).padStart(4)} | ` +
        `${String(info.triggers).padStart(8)} | ` +
        `${String(info.procedures).padStart(10)} | ` +
        `${String(info.functions).padStart(9)} | ` +
        `${String(info.events).padStart(6)}`
      );
    }
  }

  // Trouver les différences
  console.log('\n📋 DÉTAILS PAR BASE:\n');
  
  for (const [db, info] of Object.entries(results)) {
    if (info.error) continue;
    
    console.log(`📁 ${db}:`);
    
    if (info.views > 0) {
      console.log(`   📊 Vues (${info.views}): ${info.viewNames.join(', ')}`);
    }
    
    if (info.triggers > 0) {
      console.log(`   ⚡ Triggers (${info.triggers}): ${info.triggerNames.join(', ')}`);
    }
    
    if (info.procedures > 0) {
      console.log(`   📝 Procédures (${info.procedures}): ${info.procedureNames.join(', ')}`);
    }
    
    if (info.functions > 0) {
      console.log(`   🔧 Fonctions (${info.functions}): ${info.functionNames.join(', ')}`);
    }
    
    if (info.events > 0) {
      console.log(`   ⏰ Events (${info.events}): ${info.eventNames.join(', ')}`);
    }
    
    if (info.views === 0 && info.triggers === 0 && info.procedures === 0 && info.functions === 0 && info.events === 0) {
      console.log(`   ✅ Seulement des tables (pas d'objets spéciaux)`);
    }
    
    console.log('');
  }
}

compareAllObjects().catch(console.error);
