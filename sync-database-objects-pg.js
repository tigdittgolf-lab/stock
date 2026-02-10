/**
 * Script d'automatisation pour synchroniser les fonctions et procédures
 * depuis 2025_bu01 vers toutes les autres bases de données
 * Version avec connexion PostgreSQL directe
 */

import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import * as fs from 'fs';

dotenv.config();

// Configuration de la connexion PostgreSQL
const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

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
 * Crée une connexion à la base de données
 */
async function createConnection() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  return client;
}

/**
 * Récupère tous les schémas tenant (bu) de la base de données
 */
async function getAllTenantSchemas(client) {
  console.log('🔍 Recherche de tous les schémas tenant...\n');
  
  const query = `
    SELECT schema_name 
    FROM information_schema.schemata 
    WHERE schema_name LIKE '%_bu%'
      AND schema_name != $1
    ORDER BY schema_name;
  `;

  const result = await client.query(query, [SOURCE_SCHEMA]);
  return result.rows.map(row => row.schema_name);
}

/**
 * Extrait la définition complète d'une fonction/procédure
 */
async function extractObjectDefinition(client, objectName) {
  console.log(`📥 Extraction de ${objectName}...`);

  const query = `
    SELECT 
      pg_get_functiondef(p.oid) as definition,
      p.prokind as kind,
      pg_catalog.pg_get_function_arguments(p.oid) as arguments,
      pg_catalog.pg_get_function_result(p.oid) as return_type
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = $1
      AND p.proname = $2;
  `;

  const result = await client.query(query, [SOURCE_SCHEMA, objectName]);

  if (result.rows.length === 0) {
    console.warn(`⚠️  ${objectName} introuvable dans ${SOURCE_SCHEMA}`);
    return null;
  }

  const row = result.rows[0];
  return {
    name: objectName,
    definition: row.definition,
    kind: row.kind, // 'f' = function, 'p' = procedure
    arguments: row.arguments,
    returnType: row.return_type
  };
}

/**
 * Adapte la définition pour un schéma cible
 */
function adaptDefinitionForSchema(definition, targetSchema) {
  if (!definition) return null;
  
  // Remplace toutes les références au schéma source
  let adapted = definition;
  
  // Remplace les références avec guillemets
  adapted = adapted.replace(
    new RegExp(`"${SOURCE_SCHEMA}"`, 'g'),
    `"${targetSchema}"`
  );
  
  // Remplace les références sans guillemets (dans les chemins de recherche, etc.)
  adapted = adapted.replace(
    new RegExp(`\\b${SOURCE_SCHEMA}\\b`, 'g'),
    targetSchema
  );
  
  return adapted;
}

/**
 * Déploie une fonction/procédure vers un schéma cible
 */
async function deployToSchema(client, objectInfo, targetSchema) {
  if (!objectInfo) {
    console.log(`  ⏭️  Ignoré pour ${targetSchema}`);
    return { success: false, skipped: true };
  }

  const adaptedDefinition = adaptDefinitionForSchema(objectInfo.definition, targetSchema);
  
  try {
    // Supprime l'ancienne version si elle existe
    const dropQuery = objectInfo.kind === 'p' 
      ? `DROP PROCEDURE IF EXISTS "${targetSchema}".${objectInfo.name} CASCADE;`
      : `DROP FUNCTION IF EXISTS "${targetSchema}".${objectInfo.name} CASCADE;`;
    
    await client.query(dropQuery);
    
    // Crée la nouvelle version
    await client.query(adaptedDefinition);

    console.log(`  ✅ Déployé vers ${targetSchema}`);
    return { success: true, skipped: false };
  } catch (err) {
    console.error(`  ❌ Erreur pour ${targetSchema}:`, err.message);
    return { success: false, skipped: false, error: err.message };
  }
}

/**
 * Sauvegarde les définitions dans des fichiers SQL
 */
function saveDefinitionsToFile(definitions, targetSchemas) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const filename = `database-sync-${timestamp}.sql`;
  
  let content = `-- =====================================================\n`;
  content += `-- Synchronisation des fonctions et procédures\n`;
  content += `-- Source: ${SOURCE_SCHEMA}\n`;
  content += `-- Date: ${new Date().toLocaleString()}\n`;
  content += `-- =====================================================\n\n`;

  // Définitions pour le schéma source
  content += `-- DÉFINITIONS ORIGINALES (${SOURCE_SCHEMA})\n`;
  content += `-- =====================================================\n\n`;

  for (const [name, info] of Object.entries(definitions)) {
    if (info && info.definition) {
      const objectType = info.kind === 'p' ? 'PROCEDURE' : 'FUNCTION';
      content += `-- ${objectType}: ${name}\n`;
      content += `-- Arguments: ${info.arguments || 'none'}\n`;
      if (info.returnType) {
        content += `-- Returns: ${info.returnType}\n`;
      }
      content += `\n${info.definition}\n\n`;
    }
  }

  // Définitions adaptées pour chaque schéma cible
  for (const targetSchema of targetSchemas) {
    content += `\n-- =====================================================\n`;
    content += `-- DÉPLOIEMENT VERS ${targetSchema}\n`;
    content += `-- =====================================================\n\n`;

    for (const [name, info] of Object.entries(definitions)) {
      if (info && info.definition) {
        const adapted = adaptDefinitionForSchema(info.definition, targetSchema);
        content += `-- ${name}\n`;
        content += `${adapted}\n\n`;
      }
    }
  }

  fs.writeFileSync(filename, content, 'utf8');
  console.log(`\n💾 Définitions sauvegardées dans: ${filename}`);
  return filename;
}

/**
 * Génère un rapport détaillé
 */
function generateReport(stats, filename) {
  const reportFilename = filename.replace('.sql', '-report.txt');
  
  let report = `RAPPORT DE SYNCHRONISATION\n`;
  report += `${'='.repeat(60)}\n\n`;
  report += `Date: ${new Date().toLocaleString()}\n`;
  report += `Schéma source: ${SOURCE_SCHEMA}\n\n`;
  
  report += `STATISTIQUES GLOBALES\n`;
  report += `${'-'.repeat(60)}\n`;
  report += `Total d'opérations: ${stats.total}\n`;
  report += `Réussies: ${stats.success}\n`;
  report += `Échouées: ${stats.failed}\n`;
  report += `Ignorées: ${stats.skipped}\n`;
  report += `Taux de réussite: ${((stats.success / stats.total) * 100).toFixed(1)}%\n\n`;
  
  if (stats.errors.length > 0) {
    report += `ERREURS DÉTAILLÉES\n`;
    report += `${'-'.repeat(60)}\n`;
    stats.errors.forEach(err => {
      report += `\n${err.object} -> ${err.schema}:\n`;
      report += `  ${err.message}\n`;
    });
  }
  
  fs.writeFileSync(reportFilename, report, 'utf8');
  console.log(`📄 Rapport sauvegardé dans: ${reportFilename}`);
}

/**
 * Fonction principale
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Synchronisation des Fonctions et Procédures          ║');
  console.log('║  Source: ' + SOURCE_SCHEMA.padEnd(42) + '║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let client;
  
  try {
    // 1. Connexion à la base de données
    console.log('🔌 Connexion à la base de données...');
    client = await createConnection();
    console.log('✅ Connecté\n');

    // 2. Récupérer tous les schémas cibles
    const targetSchemas = await getAllTenantSchemas(client);
    
    if (targetSchemas.length === 0) {
      console.log('⚠️  Aucun schéma cible trouvé');
      return;
    }

    console.log(`📊 ${targetSchemas.length} schéma(s) cible(s) trouvé(s):`);
    targetSchemas.forEach(schema => console.log(`   - ${schema}`));
    console.log('');

    // 3. Extraire toutes les définitions
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📥 EXTRACTION DES DÉFINITIONS\n');
    
    const definitions = {};
    const allObjects = [
      ...OBJECTS_TO_SYNC.functions,
      ...OBJECTS_TO_SYNC.procedures
    ];
    
    for (const objectName of allObjects) {
      const info = await extractObjectDefinition(client, objectName);
      if (info) {
        definitions[objectName] = info;
      }
    }

    // 4. Sauvegarder les définitions
    const sqlFile = saveDefinitionsToFile(definitions, targetSchemas);

    // 5. Déployer vers tous les schémas cibles
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('🚀 DÉPLOIEMENT VERS LES SCHÉMAS CIBLES\n');

    const stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    for (const [objectName, objectInfo] of Object.entries(definitions)) {
      console.log(`\n📦 Déploiement de ${objectName}:`);

      for (const targetSchema of targetSchemas) {
        stats.total++;
        const result = await deployToSchema(client, objectInfo, targetSchema);
        
        if (result.skipped) {
          stats.skipped++;
        } else if (result.success) {
          stats.success++;
        } else {
          stats.failed++;
          stats.errors.push({
            object: objectName,
            schema: targetSchema,
            message: result.error
          });
        }
      }
    }

    // 6. Générer le rapport
    generateReport(stats, sqlFile);

    // 7. Résumé
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('📊 RÉSUMÉ DE LA SYNCHRONISATION\n');
    console.log(`   Total d'opérations: ${stats.total}`);
    console.log(`   ✅ Réussies: ${stats.success}`);
    console.log(`   ❌ Échouées: ${stats.failed}`);
    console.log(`   ⏭️  Ignorées: ${stats.skipped}`);
    console.log(`   📈 Taux de réussite: ${((stats.success / stats.total) * 100).toFixed(1)}%`);
    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log('🔌 Connexion fermée');
    }
  }
}

// Exécution
main().catch(error => {
  console.error('❌ Erreur:', error);
  process.exit(1);
});
