import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

const mysqlConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: ''
};

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const databasesToMigrate = [
  '2009_bu02',
  '2024_bu01',
  '2025_bu01',
  '2025_bu02',
  '2026_bu01',
  '2099_bu02'
];

function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) value = value.toString();
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

async function discoverTables(mysqlConn, database) {
  const [tables] = await mysqlConn.query(`
    SELECT table_name FROM information_schema.tables 
    WHERE table_schema = ? AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `, [database]);
  return tables.map(t => t.table_name || t.TABLE_NAME);
}

async function migrateTable(mysqlConn, supabase, database, tableName) {
  try {
    const [rows] = await mysqlConn.query(`SELECT * FROM \`${database}\`.\`${tableName}\``);
    if (rows.length === 0) return { success: true, count: 0, total: 0 };

    const truncSQL = `TRUNCATE TABLE "${database}"."${tableName}" CASCADE`;
    await supabase.rpc('execute_raw_sql', { p_sql: truncSQL });

    let successCount = 0;
    for (const row of rows) {
      const columns = Object.keys(row);
      const values = Object.values(row).map(escapeSQL);
      const insertSQL = `INSERT INTO "${database}"."${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')})`;
      const { data, error } = await supabase.rpc('execute_raw_sql', { p_sql: insertSQL });
      if (!error && data && data.success) successCount++;
    }

    return { success: successCount > 0, count: successCount, total: rows.length };
  } catch (error) {
    return { success: false, error: error.message, total: 0 };
  }
}

async function migrateDatabase(mysqlConn, supabase, database) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`DATABASE: ${database}`);
  console.log('='.repeat(70));

  try {
    const [dbs] = await mysqlConn.query('SHOW DATABASES LIKE ?', [database]);
    if (dbs.length === 0) {
      console.log(`  Base ${database} inexistante, ignoree`);
      return { database, tables: [], totalRecords: 0 };
    }

    console.log(`\nDecouverte des tables...`);
    const tables = await discoverTables(mysqlConn, database);
    console.log(`${tables.length} tables: ${tables.join(', ')}`);

    if (tables.length === 0) return { database, tables: [], totalRecords: 0 };

    const results = [];
    let totalRecords = 0;

    for (const tableName of tables) {
      process.stdout.write(`  ${tableName}... `);
      const result = await migrateTable(mysqlConn, supabase, database, tableName);
      results.push({ table: tableName, ...result });
      totalRecords += result.count || 0;
      console.log(result.success ? `OK ${result.count}/${result.total}` : (result.error || 'vide'));
    }

    return { database, tables: results, totalRecords };
  } catch (error) {
    console.error(`\nErreur ${database}:`, error.message);
    return { database, tables: [], totalRecords: 0, error: error.message };
  }
}

async function main() {
  console.log('MIGRATION COMPLETE MYSQL -> SUPABASE\n');
  console.log('='.repeat(70));
  console.log(`MySQL: ${mysqlConfig.host}:${mysqlConfig.port}`);
  console.log(`Supabase: ${supabaseUrl}`);
  console.log(`Bases: ${databasesToMigrate.join(', ')}`);
  console.log('='.repeat(70));

  let mysqlConn;
  try {
    console.log('\nConnexion MySQL...');
    mysqlConn = await mysql.createConnection(mysqlConfig);
    console.log('OK');

    console.log('Connexion Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('OK');

    console.log('Test fonction RPC...');
    const { error: testError } = await supabase.rpc('execute_raw_sql', { p_sql: 'SELECT 1' });
    if (testError) {
      console.error('Fonction RPC non disponible');
      return;
    }
    console.log('OK');

    const allResults = [];
    for (const database of databasesToMigrate) {
      const result = await migrateDatabase(mysqlConn, supabase, database);
      allResults.push(result);
    }

    console.log('\n' + '='.repeat(70));
    console.log('\nRESUME GLOBAL\n');
    console.log('='.repeat(70));

    let grandTotal = 0;
    let totalDatabases = 0;
    let totalTables = 0;

    allResults.forEach(dbResult => {
      console.log(`\n${dbResult.database}:`);
      if (dbResult.error) {
        console.log(`  Erreur: ${dbResult.error}`);
      } else if (dbResult.tables.length === 0) {
        console.log(`  Aucune table`);
      } else {
        totalDatabases++;
        totalTables += dbResult.tables.length;
        grandTotal += dbResult.totalRecords;
        console.log(`  ${dbResult.tables.length} tables, ${dbResult.totalRecords} enregistrements`);
        dbResult.tables.forEach(t => {
          if (t.count > 0) console.log(`     ${t.table}: ${t.count}/${t.total}`);
        });
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log(`\nTOTAL:`);
    console.log(`  ${totalDatabases} bases`);
    console.log(`  ${totalTables} tables`);
    console.log(`  ${grandTotal} enregistrements`);

    if (grandTotal > 0) {
      console.log('\nMIGRATION COMPLETE REUSSIE!');
    }
  } catch (error) {
    console.error('\nERREUR:', error.message);
  } finally {
    if (mysqlConn) await mysqlConn.end();
  }
}

main();
