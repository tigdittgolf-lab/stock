/**
 * Script d'automatisation pour synchroniser les fonctions et procédures
 * depuis 2025_bu01 vers toutes les autres bases de données
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Variables d\'environnement manquantes');
  console.error('Assurez-vous que SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont définis');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Schéma source
const SOURCE_SCHEMA = '2025_bu01';

// Fonctions et procédures à synchroniser
const OBJECTS_TO_SYNC = {
  functions: ['authenticate_user'],
  procedures: [
    'create_user',
    'delete_bl_details',
    'delete_user',
    'insert_bl_detail',
    'update_bl',
    'update_bl_json',
    'update_user'
  ]
};

/**
 * Récupère tous les schémas tenant (bu) de la base de données
 */
async function getAllTenantSchemas() {
  console.log('🔍 Recherche de tous les schémas tenant...\n');
  
  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%_bu%'
        AND schema_name != '${SOURCE_SCHEMA}'
      ORDER BY schema_name;
    `
  });

  if (error) {
    console.error('❌ Erreur lors de la récupération des schémas:', error);
    process.exit(1);
  }

  return data.map(row => row.schema_name);
}

/**
 * Extrait la définition d'une fonction depuis le schéma source
 */
async function extractFunctionDefinition(functionName, isFunction = true) {
  const objectType = isFunction ? 'FUNCTION' : 'PROCEDURE';
  
  console.log(`📥 Extraction de ${objectType} ${functionName}...`);

  const { data, error } = await supabase.rpc('exec_sql', {
    query: `
      SELECT pg_get_functiondef(p.oid) as definition
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = '${SOURCE_SCHEMA}'
        AND p.proname = '${functionName}';
    `
  });

  if (error) {
    console.error(`❌ Erreur lors de l'extraction de ${functionName}:`, error);
    return null;
  }

  if (!data || data.length === 0) {
    console.warn(`⚠️  ${objectType} ${functionName} introuvable dans ${SOURCE_SCHEMA}`);
    return null;
  }

  return data[0].definition;
}

/**
 * Adapte la définition pour un schéma cible
 */
function adaptDefinitionForSchema(definition, targetSchema) {
  if (!definition) return null;
  
  // Remplace le schéma source par le schéma cible
  return definition.replace(
    new RegExp(`"?${SOURCE_SCHEMA}"?\\.`, 'g'),
    `"${targetSchema}".`
  ).replace(
    new RegExp(`${SOURCE_SCHEMA}`, 'g'),
    targetSchema
  );
}

/**
 * Déploie une fonction/procédure vers un schéma cible
 */
async function deployToSchema(definition, targetSchema, objectName) {
  if (!definition) {
    console.log(`  ⏭️  Ignoré pour ${targetSchema}`);
    return false;
  }

  const adaptedDefinition = adaptDefinitionForSchema(definition, targetSchema);
  
  try {
    const { error } = await supabase.rpc('exec_sql', {
      query: adaptedDefinition
    });

    if (error) {
      console.error(`  ❌ Erreur pour ${targetSchema}:`, error.message);
      return false;
    }

    console.log(`  ✅ Déployé vers ${targetSchema}`);
    return true;
  } catch (err) {
    console.error(`  ❌ Exception pour ${targetSchema}:`, err.message);
    return false;
  }
}

/**
 * Sauvegarde les définitions dans des fichiers SQL
 */
function saveDefinitionsToFile(definitions) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `database-sync-${timestamp}.sql`;
  
  let content = `-- Synchronisation des fonctions et procédures\n`;
  content += `-- Source: ${SOURCE_SCHEMA}\n`;
  content += `-- Date: ${new Date().toLocaleString()}\n\n`;

  for (const [name, def] of Object.entries(definitions)) {
    if (def) {
      content += `-- =====================================================\n`;
      content += `-- ${name}\n`;
      content += `-- =====================================================\n\n`;
      content += def + '\n\n';
    }
  }

  fs.writeFileSync(filename, content, 'utf8');
  console.log(`\n💾 Définitions sauvegardées dans: ${filename}`);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Synchronisation des Fonctions et Procédures          ║');
  console.log('║  Source: ' + SOURCE_SCHEMA.padEnd(42) + '║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // 1. Récupérer tous les schémas cibles
  const targetSchemas = await getAllTenantSchemas();
  
  if (targetSchemas.length === 0) {
    console.log('⚠️  Aucun schéma cible trouvé');
    return;
  }

  console.log(`📊 ${targetSchemas.length} schéma(s) cible(s) trouvé(s):`);
  targetSchemas.forEach(schema => console.log(`   - ${schema}`));
  console.log('');

  // 2. Extraire toutes les définitions
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📥 EXTRACTION DES DÉFINITIONS\n');
  
  const definitions = {};
  
  // Extraire les fonctions
  for (const funcName of OBJECTS_TO_SYNC.functions) {
    const def = await extractFunctionDefinition(funcName, true);
    definitions[`function_${funcName}`] = def;
  }
  
  // Extraire les procédures
  for (const procName of OBJECTS_TO_SYNC.procedures) {
    const def = await extractFunctionDefinition(procName, false);
    definitions[`procedure_${procName}`] = def;
  }

  // 3. Sauvegarder les définitions
  saveDefinitionsToFile(definitions);

  // 4. Déployer vers tous les schémas cibles
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('🚀 DÉPLOIEMENT VERS LES SCHÉMAS CIBLES\n');

  const stats = {
    total: 0,
    success: 0,
    failed: 0
  };

  for (const [objectKey, definition] of Object.entries(definitions)) {
    if (!definition) continue;

    const objectName = objectKey.replace(/^(function|procedure)_/, '');
    console.log(`\n📦 Déploiement de ${objectName}:`);

    for (const targetSchema of targetSchemas) {
      stats.total++;
      const success = await deployToSchema(definition, targetSchema, objectName);
      if (success) {
        stats.success++;
      } else {
        stats.failed++;
      }
    }
  }

  // 5. Résumé
  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('📊 RÉSUMÉ DE LA SYNCHRONISATION\n');
  console.log(`   Total d'opérations: ${stats.total}`);
  console.log(`   ✅ Réussies: ${stats.success}`);
  console.log(`   ❌ Échouées: ${stats.failed}`);
  console.log(`   📈 Taux de réussite: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
  console.log('\n═══════════════════════════════════════════════════════\n');
}

// Exécution
main().catch(error => {
  console.error('❌ Erreur fatale:', error);
  process.exit(1);
});
