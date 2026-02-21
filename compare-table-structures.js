/**
 * Comparer les structures des tables MySQL vs Supabase
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

async function compareTable(mysqlConnection, supabase, tableName) {
  console.log(`\n📊 ${tableName}`);
  console.log('='.repeat(70));

  try {
    // MySQL structure
    const [mysqlCols] = await mysqlConnection.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = '2025_bu01' AND TABLE_NAME = ?
      ORDER BY ORDINAL_POSITION
    `, [tableName]);

    console.log(`\n📥 MySQL (${mysqlCols.length} colonnes):`);
    mysqlCols.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME}: ${col.DATA_TYPE} ${col.IS_NULLABLE === 'NO' ? 'NOT NULL' : 'NULL'}`);
    });

    // Supabase structure via RPC
    const { data, error } = await supabase.rpc('get_tenant_table_structure', {
      p_schema_name: schemaName,
      p_table_name: tableName
    });

    if (error) {
      console.log(`\n❌ Supabase: Impossible de récupérer la structure`);
      console.log(`  Erreur: ${error.message}`);
    } else if (data && data.success && data.columns) {
      const supabaseCols = data.columns;
      console.log(`\n📤 Supabase (${supabaseCols.length} colonnes):`);
      supabaseCols.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });

      // Comparer
      console.log(`\n🔍 Différences:`);
      const mysqlColNames = mysqlCols.map(c => c.COLUMN_NAME);
      const supabaseColNames = supabaseCols.map(c => c.column_name);

      const onlyInMySQL = mysqlColNames.filter(name => !supabaseColNames.includes(name));
      const onlyInSupabase = supabaseColNames.filter(name => !mysqlColNames.includes(name));

      if (onlyInMySQL.length > 0) {
        console.log(`  ⚠️  Colonnes uniquement dans MySQL: ${onlyInMySQL.join(', ')}`);
      }
      if (onlyInSupabase.length > 0) {
        console.log(`  ⚠️  Colonnes uniquement dans Supabase: ${onlyInSupabase.join(', ')}`);
      }
      if (onlyInMySQL.length === 0 && onlyInSupabase.length === 0) {
        console.log(`  ✅ Structures identiques`);
      }
    } else {
      console.log(`\n⚠️  Supabase: Pas de données de structure`);
    }

  } catch (error) {
    console.error(`\n❌ Erreur:`, error.message);
  }
}

async function main() {
  console.log('🔍 COMPARAISON DES STRUCTURES\n');
  console.log('='.repeat(70));

  let mysqlConnection;

  try {
    console.log('\n🔌 Connexion...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connecté');

    // Créer d'abord la fonction RPC pour récupérer la structure
    console.log('\n📝 Note: Si la fonction get_tenant_table_structure n\'existe pas,');
    console.log('   les structures Supabase ne seront pas affichées.');

    await compareTable(mysqlConnection, supabase, 'client');
    await compareTable(mysqlConnection, supabase, 'detail_bl');
    await compareTable(mysqlConnection, supabase, 'article');
    await compareTable(mysqlConnection, supabase, 'fournisseur');

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

main();
