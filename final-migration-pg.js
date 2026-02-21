/**
 * Migration FINALE MySQL → Supabase PostgreSQL
 * Connexion DIRECTE à PostgreSQL (pas via API REST)
 */

import mysql from 'mysql2/promise';
import pg from 'pg';

const { Client } = pg;

// Configuration MySQL
const mysqlConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: '2025_bu01'
};

// Configuration PostgreSQL Supabase
// IMPORTANT: Utiliser la connexion DIRECTE pour les migrations
// Le host est dérivé de l'URL Supabase: https://szgodrjglbpzkrksnroi.supabase.co
const pgConfig = {
  host: 'db.szgodrjglbpzkrksnroi.supabase.co', // Direct connection
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'Canada!2025Mosta',
  ssl: {
    rejectUnauthorized: false
  }
};

const schemaName = '2025_bu01';
const tables = ['article', 'client', 'fournisseur'];

async function migrateTable(mysqlConn, pgClient, tableName) {
  console.log(`\n📦 ${tableName}`);
  console.log('='.repeat(70));

  try {
    // 1. Lire MySQL
    const [rows] = await mysqlConn.query(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log(`  ⚪ Vide`);
      return { success: true, count: 0 };
    }

    console.log(`  📥 ${rows.length} enregistrements MySQL`);

    // 2. Truncate PostgreSQL
    try {
      await pgClient.query(`TRUNCATE TABLE "${schemaName}"."${tableName}" CASCADE`);
      console.log(`  🗑️  Table vidée`);
    } catch (e) {
      console.warn(`  ⚠️  Truncate: ${e.message}`);
    }

    // 3. Insérer les données
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const columns = Object.keys(row);
      const placeholders = columns.map((_, idx) => `$${idx + 1}`);
      const values = Object.values(row).map(v => {
        if (v === null || v === undefined) return null;
        if (Buffer.isBuffer(v)) return v.toString();
        if (v instanceof Date) return v.toISOString();
        return v;
      });

      const sql = `INSERT INTO "${schemaName}"."${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders.join(', ')})`;

      try {
        await pgClient.query(sql, values);
        successCount++;
      } catch (error) {
        errorCount++;
        if (i === 0) {
          console.error(`  ❌ Erreur ligne 1: ${error.message}`);
        }
      }
    }

    console.log(`  📊 ${successCount}/${rows.length} (${errorCount} erreurs)`);

    return {
      success: successCount > 0,
      count: successCount,
      total: rows.length
    };

  } catch (error) {
    console.error(`  ❌ ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 MIGRATION FINALE MYSQL → SUPABASE POSTGRESQL\n');
  console.log('='.repeat(70));
  console.log(`\n📋 Configuration:`);
  console.log(`  MySQL: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
  console.log(`  PostgreSQL: ${pgConfig.host}:${pgConfig.port}/${pgConfig.database}`);
  console.log(`  Schéma: ${schemaName}`);
  console.log('\n' + '='.repeat(70));

  let mysqlConn;
  let pgClient;

  try {
    // Connexion MySQL
    console.log('\n🔌 Connexion MySQL...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connecté');

    // Connexion PostgreSQL
    console.log('\n🔌 Connexion PostgreSQL Supabase...');
    pgClient = new Client(pgConfig);
    await pgClient.connect();
    console.log('✅ PostgreSQL connecté');

    // Test de connexion
    const { rows } = await pgClient.query('SELECT current_database(), current_schema()');
    console.log(`📊 Base: ${rows[0].current_database}, Schéma: ${rows[0].current_schema}`);

    // Migration
    const results = [];
    for (const table of tables) {
      const result = await migrateTable(mysqlConn, pgClient, table);
      results.push({ table, ...result });
    }

    // Résumé
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RÉSUMÉ\n');

    let total = 0;
    results.forEach(r => {
      const icon = r.success ? '✅' : '❌';
      console.log(`${icon} ${r.table}: ${r.count || 0}/${r.total || 0}`);
      total += r.count || 0;
    });

    console.log(`\n🎯 TOTAL: ${total} enregistrements migrés`);

    if (total > 0) {
      console.log('\n✅ MIGRATION RÉUSSIE!');
      console.log('\n💡 Prochaines étapes:');
      console.log('  1. Vérifier: node verify-tenant-data.js');
      console.log('  2. Tester dashboard: http://100.85.136.96:3000/dashboard');
      console.log('  3. Ou déployer sur Vercel');
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    
    if (error.message.includes('password')) {
      console.error('\n💡 SOLUTION:');
      console.error('  1. Aller sur: https://szgodrjglbpzkrksnroi.supabase.co/project/_/settings/database');
      console.error('  2. Copier le mot de passe de la base de données');
      console.error('  3. Modifier pgConfig.password dans ce script');
      console.error('  4. Relancer le script');
    } else if (error.message.includes('connect')) {
      console.error('\n💡 Vérifier:');
      console.error('  - La connexion Internet');
      console.error('  - L\'URL de connexion PostgreSQL dans Supabase');
      console.error('  - Les paramètres de connexion (host, port, user)');
    }

  } finally {
    if (mysqlConn) {
      await mysqlConn.end();
      console.log('\n🔌 MySQL déconnecté');
    }
    if (pgClient) {
      await pgClient.end();
      console.log('🔌 PostgreSQL déconnecté');
    }
  }
}

main();
