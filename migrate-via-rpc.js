/**
 * Migration MySQL → Supabase via fonctions RPC
 * Utilise les fonctions RPC créées dans Supabase
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

// Configuration
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
const tablesToMigrate = ['article', 'client', 'fournisseur', 'detail_bl'];

async function migrateTableViaRPC(mysqlConnection, supabase, tableName) {
  console.log(`\n📦 Migration: ${schemaName}.${tableName}`);
  console.log('='.repeat(70));

  try {
    // 1. Lire MySQL
    console.log(`  📥 Lecture MySQL...`);
    const [rows] = await mysqlConnection.query(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log(`  ⚪ Table vide`);
      return { success: true, count: 0, total: 0 };
    }

    console.log(`  ✅ ${rows.length} enregistrements trouvés`);

    // 2. Compter dans Supabase
    console.log(`  🔍 Vérification Supabase...`);
    const { data: countData, error: countError } = await supabase.rpc(
      'count_tenant_table_records',
      {
        p_schema_name: schemaName,
        p_table_name: tableName
      }
    );

    if (countError) {
      console.error(`  ❌ Erreur comptage:`, countError.message);
      console.error(`  💡 Les fonctions RPC sont-elles créées dans Supabase?`);
      return { success: false, error: countError.message };
    }

    console.log(`  📊 Supabase: ${countData} enregistrements actuels`);

    // 3. Supprimer les données existantes si nécessaire
    if (countData > 0) {
      console.log(`  🗑️  Suppression des données existantes...`);
      const { data: truncateData, error: truncateError } = await supabase.rpc(
        'truncate_tenant_table',
        {
          p_schema_name: schemaName,
          p_table_name: tableName
        }
      );

      if (truncateError) {
        console.warn(`  ⚠️  Erreur suppression:`, truncateError.message);
      } else {
        console.log(`  ✅ Données supprimées`);
      }
    }

    // 4. Insérer les données par lots
    console.log(`  📤 Insertion dans Supabase...`);
    const batchSize = 10; // Réduire la taille des lots pour éviter les timeouts
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      console.log(`    🔄 Lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} (${batch.length} enregistrements)...`);

      // Convertir les données en JSONB pour PostgreSQL
      const jsonbBatch = batch.map(row => {
        // Convertir les valeurs pour PostgreSQL
        const converted = {};
        for (const [key, value] of Object.entries(row)) {
          if (value instanceof Date) {
            converted[key] = value.toISOString();
          } else if (Buffer.isBuffer(value)) {
            converted[key] = value.toString();
          } else {
            converted[key] = value;
          }
        }
        return converted;
      });

      const { data: insertData, error: insertError } = await supabase.rpc(
        'insert_batch_into_tenant_table',
        {
          p_schema_name: schemaName,
          p_table_name: tableName,
          p_data: jsonbBatch
        }
      );

      if (insertError) {
        errorCount += batch.length;
        console.error(`    ❌ Erreur:`, insertError.message);
      } else if (insertData && insertData.success) {
        const inserted = insertData.inserted_count || 0;
        successCount += inserted;
        console.log(`    ✅ ${inserted}/${batch.length} insérés`);
      } else {
        errorCount += batch.length;
        console.error(`    ❌ Échec insertion`);
      }
    }

    // 5. Vérification finale
    console.log(`  🔍 Vérification finale...`);
    const { data: finalCount, error: finalError } = await supabase.rpc(
      'count_tenant_table_records',
      {
        p_schema_name: schemaName,
        p_table_name: tableName
      }
    );

    if (!finalError) {
      console.log(`  📊 Supabase: ${finalCount} enregistrements`);
      
      if (finalCount === rows.length) {
        console.log(`  ✅ PARFAIT: ${finalCount}/${rows.length}`);
      } else {
        console.warn(`  ⚠️  PARTIEL: ${finalCount}/${rows.length}`);
      }
    }

    return {
      success: successCount > 0,
      count: successCount,
      errors: errorCount,
      total: rows.length
    };

  } catch (error) {
    console.error(`  ❌ ERREUR:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 MIGRATION VIA RPC MYSQL → SUPABASE\n');
  console.log('='.repeat(70));
  console.log(`\n📋 Configuration:`);
  console.log(`  MySQL: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
  console.log(`  Supabase: ${supabaseUrl}`);
  console.log(`  Schéma: ${schemaName}`);
  console.log(`  Tables: ${tablesToMigrate.join(', ')}`);
  console.log('\n' + '='.repeat(70));

  let mysqlConnection;

  try {
    // Connexions
    console.log('\n🔌 Connexion MySQL...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connecté');

    console.log('\n🔌 Connexion Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connecté');

    // Test des fonctions RPC
    console.log('\n🧪 Test des fonctions RPC...');
    const { data: testData, error: testError } = await supabase.rpc(
      'count_tenant_table_records',
      {
        p_schema_name: schemaName,
        p_table_name: 'article'
      }
    );

    if (testError) {
      console.error('❌ Fonctions RPC non disponibles!');
      console.error('💡 Erreur:', testError.message);
      console.error('\n📋 SOLUTION:');
      console.error('  1. Ouvrir: https://szgodrjglbpzkrksnroi.supabase.co/project/_/sql');
      console.error('  2. Copier le contenu de: CREATE_SUPABASE_MIGRATION_FUNCTIONS.sql');
      console.error('  3. Coller dans l\'éditeur SQL');
      console.error('  4. Cliquer sur "Run"');
      console.error('  5. Relancer ce script');
      return;
    }

    console.log('✅ Fonctions RPC disponibles');

    // Migration
    const results = [];
    for (const tableName of tablesToMigrate) {
      const result = await migrateTableViaRPC(mysqlConnection, supabase, tableName);
      results.push({ table: tableName, ...result });
    }

    // Résumé
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RÉSUMÉ\n');

    let totalSuccess = 0;
    let totalErrors = 0;
    let totalRecords = 0;

    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.table}: ${result.count || 0}/${result.total || 0}`);
      
      totalSuccess += result.count || 0;
      totalErrors += result.errors || 0;
      totalRecords += result.total || 0;
    });

    console.log('\n' + '='.repeat(70));
    console.log(`\n🎯 TOTAL: ${totalSuccess}/${totalRecords} enregistrements`);

    if (totalSuccess === totalRecords && totalErrors === 0) {
      console.log('\n✅ MIGRATION PARFAITE!');
      console.log('\n💡 Prochaines étapes:');
      console.log('  1. Tester le dashboard: http://100.85.136.96:3000/dashboard');
      console.log('  2. Ou déployer sur Vercel pour accès smartphone direct');
    } else if (totalSuccess > 0) {
      console.log('\n⚠️  MIGRATION PARTIELLE');
    } else {
      console.log('\n❌ MIGRATION ÉCHOUÉE');
    }

  } catch (error) {
    console.error('\n❌ ERREUR:', error.message);
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('\n🔌 MySQL déconnecté');
    }
  }
}

main();
