/**
 * Migration de la table article uniquement avec debug
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

function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) value = value.toString();
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

async function main() {
  console.log('🔍 DEBUG MIGRATION ARTICLE\n');
  console.log('='.repeat(70));

  let mysqlConn;

  try {
    mysqlConn = await mysql.createConnection(mysqlConfig);
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Lire MySQL
    console.log('\n📥 Lecture MySQL...');
    const [rows] = await mysqlConn.query('SELECT * FROM article');
    console.log(`✅ ${rows.length} enregistrement(s) trouvé(s)`);
    console.log('\n📋 Données MySQL:');
    console.log(JSON.stringify(rows, null, 2));

    if (rows.length === 0) {
      console.log('\n⚠️  Table article vide dans MySQL!');
      return;
    }

    // 2. Truncate
    console.log('\n🗑️  Truncate Supabase...');
    const truncSQL = `TRUNCATE TABLE "${schemaName}"."article" CASCADE`;
    console.log(`SQL: ${truncSQL}`);
    
    const { data: truncData, error: truncError } = await supabase.rpc('execute_raw_sql', {
      p_sql: truncSQL
    });

    if (truncError) {
      console.error(`❌ Erreur truncate: ${truncError.message}`);
    } else {
      console.log(`✅ Truncate réussi:`, truncData);
    }

    // 3. Insérer
    console.log('\n📤 Insertion dans Supabase...');
    const row = rows[0];
    
    const columns = Object.keys(row);
    const values = Object.values(row).map(escapeSQL);

    const insertSQL = `INSERT INTO "${schemaName}"."article" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')})`;
    
    console.log('\n📝 SQL généré:');
    console.log(insertSQL);

    const { data: insertData, error: insertError } = await supabase.rpc('execute_raw_sql', {
      p_sql: insertSQL
    });

    if (insertError) {
      console.error('\n❌ Erreur insertion:', insertError.message);
      console.error('Détails:', insertError);
    } else {
      console.log('\n✅ Insertion réussie:');
      console.log(JSON.stringify(insertData, null, 2));
    }

    // 4. Vérifier
    console.log('\n🔍 Vérification...');
    const selectSQL = `SELECT * FROM "${schemaName}"."article"`;
    const { data: selectData, error: selectError } = await supabase.rpc('execute_raw_sql', {
      p_sql: selectSQL
    });

    if (selectError) {
      console.error('❌ Erreur vérification:', selectError.message);
    } else if (selectData && selectData.success) {
      console.log(`✅ Vérification réussie`);
      console.log(`📊 Nombre d'enregistrements: ${selectData.count || 0}`);
      if (selectData.data && selectData.data.length > 0) {
        console.log('\n📋 Données Supabase:');
        console.log(JSON.stringify(selectData.data, null, 2));
      } else {
        console.log('\n⚠️  Aucune donnée retournée!');
      }
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
    console.error(error.stack);
  } finally {
    if (mysqlConn) {
      await mysqlConn.end();
    }
  }
}

main();
