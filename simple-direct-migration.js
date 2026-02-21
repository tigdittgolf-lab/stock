/**
 * Migration DIRECTE sans RPC complexe
 * Utilise une fonction RPC simple qui exécute du SQL brut
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

async function migrateTableDirect(mysqlConnection, supabase, tableName) {
  console.log(`\n📦 ${tableName}`);
  console.log('='.repeat(70));

  try {
    // 1. Lire MySQL
    const [rows] = await mysqlConnection.query(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log(`  ⚪ Vide`);
      return { success: true, count: 0 };
    }

    console.log(`  📥 ${rows.length} enregistrements MySQL`);

    // 2. Truncate Supabase
    const { error: truncError } = await supabase.rpc('truncate_tenant_table', {
      p_schema_name: schemaName,
      p_table_name: tableName
    });

    if (truncError) {
      console.warn(`  ⚠️  Truncate: ${truncError.message}`);
    }

    // 3. Insérer UN PAR UN avec gestion d'erreur
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Construire l'INSERT SQL manuellement
      const columns = Object.keys(row);
      const values = Object.values(row).map(v => {
        if (v === null || v === undefined) return 'NULL';
        if (typeof v === 'number') return v;
        if (typeof v === 'boolean') return v ? 'true' : 'false';
        if (v instanceof Date) return `'${v.toISOString()}'`;
        if (Buffer.isBuffer(v)) return `'${v.toString()}'`;
        // Échapper les quotes
        const escaped = String(v).replace(/'/g, "''");
        return `'${escaped}'`;
      });

      const sql = `INSERT INTO "${schemaName}"."${tableName}" (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${values.join(', ')})`;

      // Utiliser une fonction RPC qui exécute du SQL brut
      const { data, error } = await supabase.rpc('execute_sql', {
        p_sql: sql
      });

      if (error) {
        errorCount++;
        if (i === 0) {
          // Afficher l'erreur seulement pour le premier
          console.error(`  ❌ Erreur ligne 1: ${error.message}`);
          console.error(`  💡 SQL: ${sql.substring(0, 200)}...`);
        }
      } else {
        successCount++;
      }
    }

    console.log(`  📊 Résultat: ${successCount}/${rows.length} (${errorCount} erreurs)`);

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
  console.log('🚀 MIGRATION DIRECTE\n');
  console.log('='.repeat(70));

  let mysqlConnection;

  try {
    console.log('\n🔌 Connexion...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Connecté');

    // Test de la fonction execute_sql
    console.log('\n🧪 Test fonction execute_sql...');
    const { error: testError } = await supabase.rpc('execute_sql', {
      p_sql: 'SELECT 1'
    });

    if (testError) {
      console.error('❌ Fonction execute_sql non disponible');
      console.error('💡 Créer cette fonction dans Supabase:');
      console.error('');
      console.error('CREATE OR REPLACE FUNCTION execute_sql(p_sql TEXT)');
      console.error('RETURNS JSONB');
      console.error('LANGUAGE plpgsql');
      console.error('SECURITY DEFINER');
      console.error('AS $$');
      console.error('BEGIN');
      console.error('  EXECUTE p_sql;');
      console.error('  RETURN jsonb_build_object(\'success\', true);');
      console.error('EXCEPTION');
      console.error('  WHEN OTHERS THEN');
      console.error('    RETURN jsonb_build_object(\'success\', false, \'error\', SQLERRM);');
      console.error('END;');
      console.error('$$;');
      console.error('');
      return;
    }

    console.log('✅ Fonction disponible');

    // Migration
    const tables = ['article', 'client', 'fournisseur'];
    const results = [];

    for (const table of tables) {
      const result = await migrateTableDirect(mysqlConnection, supabase, table);
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

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

main();
