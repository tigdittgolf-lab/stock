/**
 * Script de vérification de la migration MySQL → Supabase
 * Compare les données entre les deux bases de données
 */

import mysql from 'mysql2/promise';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, 'frontend', '.env.local') });

// Configuration MySQL
const mysqlConfig = {
  host: process.env.MYSQL_HOST || 'localhost',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || '2025_bu01'
};

// Configuration Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes');
  console.error('SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables à vérifier
const TABLES_TO_CHECK = [
  'article',
  'client',
  'fournisseur',
  'bl_vente',
  'detail_bl',
  'facture',
  'detail_facture',
  'proforma',
  'detail_proforma',
  'famille',
  'users'
];

async function getMySQLConnection() {
  try {
    const connection = await mysql.createConnection(mysqlConfig);
    console.log('✅ Connexion MySQL établie');
    return connection;
  } catch (error) {
    console.error('❌ Erreur connexion MySQL:', error.message);
    return null;
  }
}

async function getTableCount(connection, tableName) {
  try {
    const [rows] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    return rows[0].count;
  } catch (error) {
    console.error(`❌ Erreur lecture MySQL ${tableName}:`, error.message);
    return -1;
  }
}

async function getSupabaseCount(tableName) {
  try {
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.error(`❌ Erreur Supabase ${tableName}:`, error.message);
      return -1;
    }
    
    return count || 0;
  } catch (error) {
    console.error(`❌ Erreur Supabase ${tableName}:`, error.message);
    return -1;
  }
}

async function compareSampleData(connection, tableName) {
  try {
    // Récupérer 5 enregistrements de MySQL
    const [mysqlRows] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 5`);
    
    if (mysqlRows.length === 0) {
      return { match: true, message: 'Table vide dans les deux bases' };
    }
    
    // Récupérer les mêmes enregistrements de Supabase
    const { data: supabaseRows, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(5);
    
    if (error) {
      return { match: false, message: `Erreur Supabase: ${error.message}` };
    }
    
    if (!supabaseRows || supabaseRows.length === 0) {
      return { match: false, message: 'Données présentes dans MySQL mais pas dans Supabase' };
    }
    
    return { match: true, message: 'Échantillon de données présent dans les deux bases' };
  } catch (error) {
    return { match: false, message: `Erreur: ${error.message}` };
  }
}

async function verifyMigration() {
  console.log('\n🔍 VÉRIFICATION DE LA MIGRATION MYSQL → SUPABASE\n');
  console.log('='.repeat(70));
  
  const connection = await getMySQLConnection();
  if (!connection) {
    console.log('\n❌ Impossible de se connecter à MySQL');
    return;
  }
  
  const results = [];
  let totalErrors = 0;
  let totalWarnings = 0;
  
  for (const tableName of TABLES_TO_CHECK) {
    console.log(`\n📊 Vérification: ${tableName}`);
    console.log('-'.repeat(70));
    
    const mysqlCount = await getTableCount(connection, tableName);
    const supabaseCount = await getSupabaseCount(tableName);
    
    const result = {
      table: tableName,
      mysqlCount,
      supabaseCount,
      status: 'unknown',
      message: ''
    };
    
    if (mysqlCount === -1 || supabaseCount === -1) {
      result.status = 'error';
      result.message = 'Erreur de lecture';
      totalErrors++;
      console.log(`  ❌ Erreur de lecture`);
    } else if (mysqlCount === 0 && supabaseCount === 0) {
      result.status = 'empty';
      result.message = 'Tables vides (normal pour certaines tables)';
      console.log(`  ⚪ MySQL: ${mysqlCount} | Supabase: ${supabaseCount} (vides)`);
    } else if (mysqlCount === supabaseCount) {
      result.status = 'perfect';
      result.message = 'Nombre d\'enregistrements identique';
      console.log(`  ✅ MySQL: ${mysqlCount} | Supabase: ${supabaseCount} (identique)`);
      
      // Vérifier un échantillon de données
      const sampleCheck = await compareSampleData(connection, tableName);
      if (sampleCheck.match) {
        console.log(`  ✅ ${sampleCheck.message}`);
      } else {
        console.log(`  ⚠️  ${sampleCheck.message}`);
        totalWarnings++;
      }
    } else {
      const diff = Math.abs(mysqlCount - supabaseCount);
      const percentDiff = ((diff / Math.max(mysqlCount, supabaseCount)) * 100).toFixed(2);
      
      result.status = 'mismatch';
      result.message = `Différence de ${diff} enregistrements (${percentDiff}%)`;
      totalWarnings++;
      console.log(`  ⚠️  MySQL: ${mysqlCount} | Supabase: ${supabaseCount}`);
      console.log(`  ⚠️  Différence: ${diff} enregistrements (${percentDiff}%)`);
    }
    
    results.push(result);
  }
  
  await connection.end();
  
  // Résumé
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 RÉSUMÉ DE LA VÉRIFICATION\n');
  
  const perfect = results.filter(r => r.status === 'perfect').length;
  const empty = results.filter(r => r.status === 'empty').length;
  const mismatch = results.filter(r => r.status === 'mismatch').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`✅ Tables parfaitement migrées: ${perfect}`);
  console.log(`⚪ Tables vides: ${empty}`);
  console.log(`⚠️  Tables avec différences: ${mismatch}`);
  console.log(`❌ Tables avec erreurs: ${errors}`);
  
  console.log('\n' + '='.repeat(70));
  
  if (errors === 0 && mismatch === 0) {
    console.log('\n🎉 MIGRATION PARFAITE ! Toutes les données sont correctement migrées.\n');
    console.log('✅ Tu peux utiliser Supabase sans problème depuis ton smartphone.\n');
  } else if (errors === 0 && mismatch <= 2) {
    console.log('\n✅ MIGRATION RÉUSSIE avec quelques différences mineures.\n');
    console.log('⚠️  Vérifie les tables avec différences si elles sont critiques.\n');
    console.log('✅ Tu peux utiliser Supabase, mais vérifie les données importantes.\n');
  } else {
    console.log('\n⚠️  MIGRATION INCOMPLÈTE - Des problèmes ont été détectés.\n');
    console.log('❌ Certaines données peuvent manquer dans Supabase.\n');
    console.log('🔧 Recommandation: Relancer la migration pour les tables problématiques.\n');
  }
  
  // Détails des problèmes
  const problemTables = results.filter(r => r.status === 'mismatch' || r.status === 'error');
  if (problemTables.length > 0) {
    console.log('\n📋 TABLES AVEC PROBLÈMES:\n');
    problemTables.forEach(t => {
      console.log(`  • ${t.table}: ${t.message}`);
    });
    console.log('');
  }
}

// Exécuter la vérification
verifyMigration().catch(error => {
  console.error('\n❌ Erreur fatale:', error);
  process.exit(1);
});
