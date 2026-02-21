/**
 * Script de vérification des données Supabase
 * Vérifie que les données sont présentes et accessibles
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement
dotenv.config({ path: join(__dirname, 'frontend', '.env.local') });

// Configuration Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variables Supabase manquantes');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tables critiques à vérifier
const CRITICAL_TABLES = [
  { name: 'article', description: 'Articles' },
  { name: 'client', description: 'Clients' },
  { name: 'fournisseur', description: 'Fournisseurs' },
  { name: 'bl_vente', description: 'Bons de livraison' },
  { name: 'facture', description: 'Factures' },
  { name: 'users', description: 'Utilisateurs' }
];

async function getTableInfo(tableName) {
  try {
    // Compter les enregistrements
    const { count, error: countError } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      return { 
        exists: false, 
        count: 0, 
        error: countError.message,
        sample: null
      };
    }
    
    // Récupérer un échantillon
    const { data: sample, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(3);
    
    return {
      exists: true,
      count: count || 0,
      error: null,
      sample: sample || []
    };
  } catch (error) {
    return {
      exists: false,
      count: 0,
      error: error.message,
      sample: null
    };
  }
}

async function verifySupabaseData() {
  console.log('\n🔍 VÉRIFICATION DES DONNÉES SUPABASE\n');
  console.log('='.repeat(70));
  console.log(`\n📡 URL: ${supabaseUrl}\n`);
  
  const results = [];
  let totalRecords = 0;
  let tablesWithData = 0;
  let tablesWithErrors = 0;
  
  for (const table of CRITICAL_TABLES) {
    console.log(`\n📊 ${table.description} (${table.name})`);
    console.log('-'.repeat(70));
    
    const info = await getTableInfo(table.name);
    
    if (!info.exists) {
      console.log(`  ❌ Erreur: ${info.error}`);
      tablesWithErrors++;
      results.push({ ...table, status: 'error', count: 0, error: info.error });
    } else if (info.count === 0) {
      console.log(`  ⚪ Table vide (0 enregistrements)`);
      results.push({ ...table, status: 'empty', count: 0 });
    } else {
      console.log(`  ✅ ${info.count} enregistrements`);
      
      // Afficher un échantillon
      if (info.sample && info.sample.length > 0) {
        console.log(`  📋 Échantillon (${info.sample.length} premiers):`);
        info.sample.forEach((record, index) => {
          const keys = Object.keys(record).slice(0, 3);
          const preview = keys.map(k => `${k}: ${record[k]}`).join(', ');
          console.log(`     ${index + 1}. ${preview}...`);
        });
      }
      
      totalRecords += info.count;
      tablesWithData++;
      results.push({ ...table, status: 'ok', count: info.count });
    }
  }
  
  // Résumé
  console.log('\n' + '='.repeat(70));
  console.log('\n📋 RÉSUMÉ\n');
  
  console.log(`✅ Tables avec données: ${tablesWithData}/${CRITICAL_TABLES.length}`);
  console.log(`⚪ Tables vides: ${CRITICAL_TABLES.length - tablesWithData - tablesWithErrors}`);
  console.log(`❌ Tables avec erreurs: ${tablesWithErrors}`);
  console.log(`📊 Total enregistrements: ${totalRecords.toLocaleString('fr-FR')}`);
  
  console.log('\n' + '='.repeat(70));
  
  // Verdict
  if (tablesWithErrors > 0) {
    console.log('\n❌ PROBLÈME DÉTECTÉ\n');
    console.log('Certaines tables ne sont pas accessibles.');
    console.log('Vérifie les permissions Supabase ou la structure des tables.\n');
    return false;
  } else if (tablesWithData === 0) {
    console.log('\n⚠️  AUCUNE DONNÉE\n');
    console.log('Toutes les tables sont vides.');
    console.log('Tu dois migrer les données de MySQL vers Supabase.\n');
    return false;
  } else if (tablesWithData < CRITICAL_TABLES.length / 2) {
    console.log('\n⚠️  MIGRATION PARTIELLE\n');
    console.log('Certaines tables critiques sont vides.');
    console.log('La migration n\'est pas complète.\n');
    return false;
  } else {
    console.log('\n✅ SUPABASE OPÉRATIONNEL\n');
    console.log('Les données sont présentes et accessibles.');
    console.log('Tu peux utiliser Supabase depuis ton smartphone sans problème!\n');
    
    // Détails des tables
    console.log('📊 DÉTAILS PAR TABLE:\n');
    results.forEach(r => {
      const icon = r.status === 'ok' ? '✅' : r.status === 'empty' ? '⚪' : '❌';
      const count = r.count > 0 ? `${r.count} enregistrements` : 'vide';
      console.log(`  ${icon} ${r.description}: ${count}`);
    });
    console.log('');
    
    return true;
  }
}

// Exécuter la vérification
verifySupabaseData()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n❌ Erreur fatale:', error.message);
    process.exit(1);
  });
