/**
 * Script de rollback pour annuler une synchronisation
 * Supprime les fonctions/procédures des schémas cibles
 */

import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';
import * as readline from 'readline';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const SOURCE_SCHEMA = '2025_bu01';

const OBJECTS_TO_REMOVE = {
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
 * Demande confirmation à l'utilisateur
 */
function askConfirmation(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'oui' || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Récupère tous les schémas tenant sauf le source
 */
async function getAllTenantSchemas(client) {
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
 * Supprime une fonction/procédure d'un schéma
 */
async function removeFromSchema(client, objectName, targetSchema, isFunction = true) {
  const objectType = isFunction ? 'FUNCTION' : 'PROCEDURE';
  
  try {
    // Vérifier si l'objet existe
    const checkQuery = `
      SELECT COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = $1 AND p.proname = $2;
    `;
    
    const checkResult = await client.query(checkQuery, [targetSchema, objectName]);
    
    if (checkResult.rows[0].count === 0) {
      console.log(`  ⏭️  ${objectName} n'existe pas dans ${targetSchema}`);
      return { success: true, skipped: true };
    }

    // Supprimer l'objet
    const dropQuery = isFunction
      ? `DROP FUNCTION IF EXISTS "${targetSchema}".${objectName} CASCADE;`
      : `DROP PROCEDURE IF EXISTS "${targetSchema}".${objectName} CASCADE;`;
    
    await client.query(dropQuery);
    console.log(`  ✅ ${objectName} supprimé de ${targetSchema}`);
    return { success: true, skipped: false };

  } catch (err) {
    console.error(`  ❌ Erreur pour ${targetSchema}:`, err.message);
    return { success: false, skipped: false, error: err.message };
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  ROLLBACK - Suppression des Fonctions/Procédures      ║');
  console.log('║  ⚠️  ATTENTION : Opération destructive                ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  let client;
  
  try {
    // Connexion
    console.log('🔌 Connexion à la base de données...');
    client = await createConnection();
    console.log('✅ Connecté\n');

    // Récupérer les schémas cibles
    const targetSchemas = await getAllTenantSchemas(client);
    
    if (targetSchemas.length === 0) {
      console.log('⚠️  Aucun schéma cible trouvé');
      return;
    }

    console.log(`📊 ${targetSchemas.length} schéma(s) cible(s):`);
    targetSchemas.forEach(schema => console.log(`   - ${schema}`));
    console.log('');

    // Afficher ce qui va être supprimé
    console.log('🗑️  Objets qui seront supprimés:\n');
    console.log('Fonctions:');
    OBJECTS_TO_REMOVE.functions.forEach(f => console.log(`   - ${f}`));
    console.log('\nProcédures:');
    OBJECTS_TO_REMOVE.procedures.forEach(p => console.log(`   - ${p}`));
    console.log('');

    // Demander confirmation
    console.log('⚠️  ATTENTION : Cette opération va supprimer ces objets de TOUS les schémas cibles.');
    console.log(`⚠️  Le schéma source (${SOURCE_SCHEMA}) ne sera PAS affecté.\n`);
    
    const confirmed = await askConfirmation('Êtes-vous sûr de vouloir continuer ? (oui/non) : ');
    
    if (!confirmed) {
      console.log('\n❌ Opération annulée par l\'utilisateur');
      return;
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('🗑️  SUPPRESSION EN COURS\n');

    const stats = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      errors: []
    };

    // Supprimer les fonctions
    for (const funcName of OBJECTS_TO_REMOVE.functions) {
      console.log(`\n📦 Suppression de la fonction ${funcName}:`);
      
      for (const targetSchema of targetSchemas) {
        stats.total++;
        const result = await removeFromSchema(client, funcName, targetSchema, true);
        
        if (result.skipped) {
          stats.skipped++;
        } else if (result.success) {
          stats.success++;
        } else {
          stats.failed++;
          stats.errors.push({
            object: funcName,
            schema: targetSchema,
            message: result.error
          });
        }
      }
    }

    // Supprimer les procédures
    for (const procName of OBJECTS_TO_REMOVE.procedures) {
      console.log(`\n📦 Suppression de la procédure ${procName}:`);
      
      for (const targetSchema of targetSchemas) {
        stats.total++;
        const result = await removeFromSchema(client, procName, targetSchema, false);
        
        if (result.skipped) {
          stats.skipped++;
        } else if (result.success) {
          stats.success++;
        } else {
          stats.failed++;
          stats.errors.push({
            object: procName,
            schema: targetSchema,
            message: result.error
          });
        }
      }
    }

    // Résumé
    console.log('\n═══════════════════════════════════════════════════════\n');
    console.log('📊 RÉSUMÉ DU ROLLBACK\n');
    console.log(`   Total d'opérations: ${stats.total}`);
    console.log(`   ✅ Réussies: ${stats.success}`);
    console.log(`   ❌ Échouées: ${stats.failed}`);
    console.log(`   ⏭️  Ignorées: ${stats.skipped}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ ERREURS:\n');
      stats.errors.forEach(err => {
        console.log(`   ${err.object} -> ${err.schema}: ${err.message}`);
      });
    }
    
    console.log('\n═══════════════════════════════════════════════════════\n');

    if (stats.failed === 0) {
      console.log('✅ Rollback terminé avec succès');
    } else {
      console.log('⚠️  Rollback terminé avec des erreurs');
    }

  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    throw error;
  } finally {
    if (client) {
      await client.end();
      console.log('\n🔌 Connexion fermée');
    }
  }
}

async function createConnection() {
  const client = new Client(DB_CONFIG);
  await client.connect();
  return client;
}

// Exécution
main().catch(error => {
  console.error('Erreur:', error);
  process.exit(1);
});
