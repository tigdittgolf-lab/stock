import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

const mysqlConfig = { host: 'localhost', port: 3306, user: 'root', password: '' };
const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const databasesToMigrate = ['2009_bu02', '2024_bu01', '2025_bu01', '2025_bu02', '2026_bu01', '2099_bu02'];

function escapeSQL(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return value;
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return `'${value.toISOString()}'`;
  if (Buffer.isBuffer(value)) value = value.toString();
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

async function migrateTable(mysqlConn, supabase, database, tableName) {
  try {
    const [rows] = await mysqlConn.query(`SELECT * FROM \`${database}\`.\`${tableName}\``);
    if (rows.length === 0) return { count: 0, total: 0 };

    await supabase.rpc('execute_raw_sql', { p_sql: `TRUNCATE TABLE "${database}"."${tableName}" CASCADE` });

    let successCount = 0;
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const columns = Object.keys(row);
      const values = Object.values(row).map(escapeSQL);
      const insertSQL = `INSERT INTO "${database}"."${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')})`;
      const { data, error } = await supabase.rpc('execute_raw_sql', { p_sql: insertSQL });
      if (!error && data && data.success) successCount++;
      
      // Afficher progression tous les 10 enregistrements
      if ((i + 1) % 10 === 0 || i === rows.length - 1) {
        process.stdout.write(`\r  ${tableName}... ${i + 1}/${rows.length}`);
      }
    }
    console.log(` OK`);
    return { count: successCount, total: rows.length };
  } catch (error) {
    console.log(` ERR: ${error.message.substring(0, 50)}`);
    return { count: 0, total: 0 };
  }
}

async function main() {
  console.log('MIGRATION RAPIDE - 6 BASES\n');
  let mysqlConn;
  try {
    mysqlConn = await mysql.createConnection(mysqlConfig);
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Connexion OK\n');

    let grandTotal = 0;
    const startTime = Date.now();

    for (const database of databasesToMigrate) {
      console.log(`\n${database}:`);
      
      const [dbs] = await mysqlConn.query('SHOW DATABASES LIKE ?', [database]);
      if (dbs.length === 0) {
        console.log('  Inexistante');
        continue;
      }

      const [tables] = await mysqlConn.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = ? AND table_type = 'BASE TABLE'
      `, [database]);
      
      const tableNames = tables.map(t => t.table_name || t.TABLE_NAME);
      console.log(`  ${tableNames.length} tables`);

      let dbTotal = 0;
      for (const tableName of tableNames) {
        const result = await migrateTable(mysqlConn, supabase, database, tableName);
        dbTotal += result.count;
      }
      
      grandTotal += dbTotal;
      console.log(`  Total: ${dbTotal} enregistrements`);
    }

    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n${'='.repeat(50)}`);
    console.log(`TOTAL: ${grandTotal} enregistrements en ${duration}s`);
    console.log('MIGRATION COMPLETE!');

  } catch (error) {
    console.error('ERREUR:', error.message);
  } finally {
    if (mysqlConn) await mysqlConn.end();
  }
}

main();
