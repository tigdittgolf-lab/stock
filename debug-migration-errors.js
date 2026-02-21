/**
 * Debug des erreurs de migration
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

async function debugTable(mysqlConnection, supabase, tableName) {
  console.log(`\n🔍 DEBUG: ${tableName}`);
  console.log('='.repeat(70));

  try {
    // 1. Lire les données MySQL
    const [rows] = await mysqlConnection.query(`SELECT * FROM ${tableName}`);
    console.log(`\n📥 Données MySQL (${rows.length} enregistrements):`);
    console.log(JSON.stringify(rows, null, 2));

    if (rows.length === 0) return;

    // 2. Tester l'insertion d'UN SEUL enregistrement
    const testRow = rows[0];
    console.log(`\n🧪 Test insertion 1 enregistrement:`);
    console.log(JSON.stringify(testRow, null, 2));

    // Convertir pour PostgreSQL
    const converted = {};
    for (const [key, value] of Object.entries(testRow)) {
      if (value instanceof Date) {
        converted[key] = value.toISOString();
      } else if (Buffer.isBuffer(value)) {
        converted[key] = value.toString();
      } else {
        converted[key] = value;
      }
    }

    console.log(`\n📝 Données converties:`);
    console.log(JSON.stringify(converted, null, 2));

    // Tester l'insertion
    const { data, error } = await supabase.rpc(
      'insert_into_tenant_table',
      {
        p_schema_name: schemaName,
        p_table_name: tableName,
        p_data: converted
      }
    );

    if (error) {
      console.error(`\n❌ ERREUR RPC:`);
      console.error(`  Message: ${error.message}`);
      console.error(`  Code: ${error.code}`);
      console.error(`  Details: ${error.details}`);
      console.error(`  Hint: ${error.hint}`);
    } else {
      console.log(`\n✅ SUCCÈS:`);
      console.log(JSON.stringify(data, null, 2));
    }

  } catch (error) {
    console.error(`\n❌ EXCEPTION:`, error.message);
    console.error(error.stack);
  }
}

async function main() {
  console.log('🐛 DEBUG MIGRATION ERRORS\n');
  console.log('='.repeat(70));

  let mysqlConnection;

  try {
    console.log('\n🔌 Connexion...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connecté');

    // Debug des tables qui ont échoué
    await debugTable(mysqlConnection, supabase, 'client');
    await debugTable(mysqlConnection, supabase, 'detail_bl');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

main();
