/**
 * Migration SIMPLE MySQL → Supabase
 * Sans dépendance aux fonctions RPC
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';

// Configuration MySQL
const mysqlConfig = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '', // Vide par défaut
  database: '2025_bu01'
};

// Configuration Supabase
const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

// Tables à migrer (dans l'ordre pour respecter les dépendances)
const tablesToMigrate = [
  'article',
  'client',
  'fournisseur',
  'detail_bl'
];

async function migrateTable(mysqlConnection, supabase, tableName, schemaName = '2025_bu01') {
  console.log(`\n📦 Migration de la table: ${schemaName}.${tableName}`);
  console.log('='.repeat(70));

  try {
    // 1. Lire les données de MySQL
    console.log(`  📥 Lecture des données MySQL...`);
    const [rows] = await mysqlConnection.query(`SELECT * FROM ${tableName}`);
    
    if (rows.length === 0) {
      console.log(`  ⚪ Table ${tableName} vide, ignorée`);
      return { success: true, count: 0 };
    }

    console.log(`  ✅ ${rows.length} enregistrements trouvés`);

    // 2. Vérifier si la table existe dans Supabase (schéma tenant)
    console.log(`  🔍 Vérification table Supabase (${schemaName})...`);
    const { count: existingCount, error: countError } = await supabase
      .from(`${schemaName}.${tableName}`)
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error(`  ❌ Erreur vérification Supabase:`, countError.message);
      return { success: false, error: countError.message };
    }

    console.log(`  📊 Supabase contient actuellement ${existingCount} enregistrements`);

    // 3. Supprimer les données existantes (optionnel)
    if (existingCount > 0) {
      console.log(`  🗑️  Suppression des données existantes...`);
      const { error: deleteError } = await supabase
        .from(`${schemaName}.${tableName}`)
        .delete()
        .neq('id', 0); // Supprimer tous les enregistrements

      if (deleteError) {
        console.warn(`  ⚠️  Erreur suppression:`, deleteError.message);
      } else {
        console.log(`  ✅ Données existantes supprimées`);
      }
    }

    // 4. Insérer les données dans Supabase
    console.log(`  📤 Insertion dans Supabase...`);
    
    // Insérer par lots de 100
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      console.log(`    🔄 Lot ${Math.floor(i / batchSize) + 1}/${Math.ceil(rows.length / batchSize)} (${batch.length} enregistrements)...`);

      const { data, error } = await supabase
        .from(`${schemaName}.${tableName}`)
        .insert(batch);

      if (error) {
        errorCount += batch.length;
        console.error(`    ❌ Erreur insertion lot:`, error.message);
        console.error(`    📋 Détails:`, error.details);
        console.error(`    💡 Hint:`, error.hint);
      } else {
        successCount += batch.length;
        console.log(`    ✅ Lot inséré avec succès`);
      }
    }

    // 5. Vérification finale
    console.log(`  🔍 Vérification finale...`);
    const { count: finalCount, error: finalError } = await supabase
      .from(`${schemaName}.${tableName}`)
      .select('*', { count: 'exact', head: true });

    if (finalError) {
      console.error(`  ❌ Erreur vérification finale:`, finalError.message);
    } else {
      console.log(`  📊 Supabase contient maintenant ${finalCount} enregistrements`);
      
      if (finalCount === rows.length) {
        console.log(`  ✅ Migration PARFAITE: ${finalCount}/${rows.length} enregistrements`);
      } else {
        console.warn(`  ⚠️  Migration PARTIELLE: ${finalCount}/${rows.length} enregistrements`);
      }
    }

    return {
      success: successCount > 0,
      count: successCount,
      errors: errorCount,
      total: rows.length
    };

  } catch (error) {
    console.error(`  ❌ ERREUR FATALE:`, error.message);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 MIGRATION SIMPLE MYSQL → SUPABASE\n');
  console.log('='.repeat(70));
  console.log('\n📋 Configuration:');
  console.log(`  MySQL: ${mysqlConfig.host}:${mysqlConfig.port}/${mysqlConfig.database}`);
  console.log(`  Supabase: ${supabaseUrl}`);
  console.log(`  Tables: ${tablesToMigrate.join(', ')}`);
  console.log('\n' + '='.repeat(70));

  let mysqlConnection;
  
  try {
    // 1. Connexion MySQL
    console.log('\n🔌 Connexion à MySQL...');
    mysqlConnection = await mysql.createConnection(mysqlConfig);
    console.log('✅ MySQL connecté');

    // 2. Connexion Supabase
    console.log('\n🔌 Connexion à Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase connecté');

    // 3. Migration de chaque table
    const results = [];
    const schemaName = '2025_bu01'; // Schéma tenant
    
    for (const tableName of tablesToMigrate) {
      const result = await migrateTable(mysqlConnection, supabase, tableName, schemaName);
      results.push({ table: tableName, ...result });
    }

    // 4. Résumé final
    console.log('\n' + '='.repeat(70));
    console.log('\n📊 RÉSUMÉ DE LA MIGRATION\n');
    
    let totalSuccess = 0;
    let totalErrors = 0;
    let totalRecords = 0;

    results.forEach(result => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${icon} ${result.table}: ${result.count || 0}/${result.total || 0} enregistrements`);
      
      if (result.errors > 0) {
        console.log(`   ⚠️  ${result.errors} erreurs`);
      }

      totalSuccess += result.count || 0;
      totalErrors += result.errors || 0;
      totalRecords += result.total || 0;
    });

    console.log('\n' + '='.repeat(70));
    console.log(`\n🎯 TOTAL: ${totalSuccess}/${totalRecords} enregistrements migrés`);
    
    if (totalErrors > 0) {
      console.log(`⚠️  ${totalErrors} erreurs rencontrées`);
    }

    if (totalSuccess === totalRecords && totalErrors === 0) {
      console.log('\n✅ MIGRATION PARFAITE - Toutes les données ont été migrées!');
    } else if (totalSuccess > 0) {
      console.log('\n⚠️  MIGRATION PARTIELLE - Certaines données ont été migrées');
    } else {
      console.log('\n❌ MIGRATION ÉCHOUÉE - Aucune donnée n\'a été migrée');
    }

    console.log('\n💡 Vous pouvez maintenant tester l\'application sur smartphone via Supabase');
    console.log('💡 URL Dashboard: http://100.85.136.96:3000/dashboard (via Tailscale)');
    console.log('💡 Ou déployer sur Vercel pour accès direct');

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('\n💡 Vérifier que:');
    console.error('  1. MySQL est démarré et accessible');
    console.error('  2. La base 2025_bu01 existe');
    console.error('  3. Les tables existent dans MySQL');
    console.error('  4. Les tables existent dans Supabase avec la même structure');
    console.error('  5. La clé Supabase est valide (service_role_key)');
  } finally {
    if (mysqlConnection) {
      await mysqlConnection.end();
      console.log('\n🔌 Connexion MySQL fermée');
    }
  }
}

// Lancer la migration
main();
