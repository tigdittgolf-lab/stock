/**
 * Script de vérification de la synchronisation
 * Vérifie que toutes les fonctions et procédures existent dans tous les schémas
 */

import pkg from 'pg';
const { Client } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
};

const EXPECTED_OBJECTS = [
  'authenticate_user',
  'create_user',
  'delete_bl_details',
  'delete_user',
  'insert_bl_detail',
  'update_bl',
  'update_bl_json',
  'update_user'
];

async function verifySync() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Vérification de la Synchronisation                   ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('✅ Connecté à la base de données\n');

    // Récupérer tous les schémas tenant
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%_bu%'
      ORDER BY schema_name;
    `);

    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`📊 ${schemas.length} schéma(s) trouvé(s):\n`);

    // Matrice de vérification
    const matrix = {};
    
    for (const schema of schemas) {
      matrix[schema] = {};
      
      for (const objectName of EXPECTED_OBJECTS) {
        const result = await client.query(`
          SELECT COUNT(*) as count
          FROM pg_proc p
          JOIN pg_namespace n ON p.pronamespace = n.oid
          WHERE n.nspname = $1 AND p.proname = $2;
        `, [schema, objectName]);
        
        matrix[schema][objectName] = result.rows[0].count > 0;
      }
    }

    // Affichage de la matrice
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('MATRICE DE VÉRIFICATION\n');
    
    // En-tête
    const header = 'Schéma'.padEnd(20) + ' | ' + 
      EXPECTED_OBJECTS.map(o => o.substring(0, 3)).join(' | ');
    console.log(header);
    console.log('-'.repeat(header.length));

    // Lignes
    let allGood = true;
    for (const schema of schemas) {
      const row = schema.padEnd(20) + ' | ' + 
        EXPECTED_OBJECTS.map(o => matrix[schema][o] ? '✅ ' : '❌ ').join(' | ');
      console.log(row);
      
      // Vérifier si tout est OK pour ce schéma
      const schemaOk = EXPECTED_OBJECTS.every(o => matrix[schema][o]);
      if (!schemaOk) allGood = false;
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    // Résumé détaillé
    console.log('RÉSUMÉ DÉTAILLÉ\n');
    
    for (const objectName of EXPECTED_OBJECTS) {
      const presentIn = schemas.filter(s => matrix[s][objectName]);
      const missingIn = schemas.filter(s => !matrix[s][objectName]);
      
      if (missingIn.length === 0) {
        console.log(`✅ ${objectName}: présent dans tous les schémas`);
      } else {
        console.log(`❌ ${objectName}: manquant dans ${missingIn.length} schéma(s)`);
        missingIn.forEach(s => console.log(`   - ${s}`));
      }
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

    if (allGood) {
      console.log('🎉 SUCCÈS : Tous les objets sont présents dans tous les schémas !');
    } else {
      console.log('⚠️  ATTENTION : Certains objets sont manquants. Exécutez le script de synchronisation.');
    }

    console.log('\n═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Erreur:', error);
    throw error;
  } finally {
    await client.end();
  }
}

verifySync().catch(error => {
  console.error('Erreur fatale:', error);
  process.exit(1);
});
