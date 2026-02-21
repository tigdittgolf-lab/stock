/**
 * Migration via fonction RPC execute_raw_sql
 * Plus simple et fonctionne avec l'API Supabase
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

const mysqlConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  database: '2025_bu01'
};

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const schemaName = '2025_bu01';
const tables = ['article', 'client', 'fournisseur'];

function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) value = value.toString();
  // Échapper les quotes
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

async function migrateTable(mysqlConn, supabase, tableName) {
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

    // 2. Truncate
    const truncSQL = `TRUNCATE TABLE "${schemaName}"."${tableName}" CASCADE`;
    const { data: truncData, error: truncError } = await supabase.rpc('execute_raw_sql', {
      p_sql: truncSQL
    });

    if (truncError) {
      console.warn(`  ⚠️  Truncate: ${truncError.message}`);
    } else if (truncData && !truncData.success) {
      console.warn(`  ⚠️  Truncate: ${truncData.error}`);
    } else {
      console.log(`  🗑️  Table vidée`);
    }

    // 3. Insérer
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      const columns = Object.keys(row);
      const values = Object.values(row).map(escapeSQL);

      const insertSQL = `INSERT INTO "${schemaName}"."${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')})`;

      const { data, error } = await supabase.rpc('execute_raw_sql', {
        p_sql: insertSQL
      });

      if (error) {
        errorCount++;
        if (i === 0) {
          console.error(`  ❌ Erreur ligne 1: ${error.message}`);
        }
      } else if (data && data.success) {
        successCount++;
      } else if (data && !data.success) {
        errorCount++;
        if (i === 0) {
          console.error(`  ❌ Erreur ligne 1: ${data.error}`);
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
  console.log('🚀 MIGRATION VIA EXECUTE_RAW_SQL\n');
  console.log('='.repeat(70));

  let mysqlConn;

  try {
    console.log('\n🔌 Connexion...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connecté');

    // Test de la fonction
    console.log('\n🧪 Test fonction execute_raw_sql...');
    const { data: testData, error: testError } = await supabase.rpc('execute_raw_sql', {
      p_sql: 'SELECT 1'
    });

    if (testError) {
      console.error('❌ Fonction non disponible:', testError.message);
      console.error('\n💡 SOLUTION:');
      console.error('  1. Ouvrir: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql');
      console.error('  2. Copier le contenu de: CREATE_EXECUTE_SQL_FUNCTION.sql');
      console.error('  3. Coller et exécuter');
      console.error('  4. Relancer ce script');
      return;
    }

    console.log('✅ Fonction disponible');

    // Migration
    const results = [];
    for (const table of tables) {
      const result = await migrateTable(mysqlConn, supabase, table);
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
      console.log('\n💡 Vérifier: node verify-tenant-data.js');
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  } finally {
    if (mysqlConn) {
      await mysqlConn.end();
    }
  }
}

main();
