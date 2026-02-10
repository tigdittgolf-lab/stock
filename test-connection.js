/**
 * Script de test de connexion
 * Vérifie que la configuration est correcte avant de lancer la synchronisation
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

async function testConnection() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  Test de Connexion à la Base de Données               ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Vérifier les variables d'environnement
  console.log('📋 Configuration:\n');
  console.log(`   Host: ${DB_CONFIG.host || '❌ NON DÉFINI'}`);
  console.log(`   Port: ${DB_CONFIG.port}`);
  console.log(`   Database: ${DB_CONFIG.database || '❌ NON DÉFINI'}`);
  console.log(`   User: ${DB_CONFIG.user || '❌ NON DÉFINI'}`);
  console.log(`   Password: ${DB_CONFIG.password ? '✅ Défini' : '❌ NON DÉFINI'}`);
  console.log('');

  if (!DB_CONFIG.host || !DB_CONFIG.user || !DB_CONFIG.password) {
    console.error('❌ Configuration incomplète !');
    console.error('   Vérifiez votre fichier .env\n');
    process.exit(1);
  }

  let client;
  
  try {
    console.log('🔌 Tentative de connexion...');
    client = new Client(DB_CONFIG);
    await client.connect();
    console.log('✅ Connexion réussie !\n');

    // Test de requête simple
    console.log('🔍 Test de requête...');
    const versionResult = await client.query('SELECT version();');
    console.log('✅ Requête réussie\n');
    console.log('📊 Version PostgreSQL:');
    console.log(`   ${versionResult.rows[0].version.split(',')[0]}\n`);

    // Lister les schémas tenant
    console.log('🔍 Recherche des schémas tenant...');
    const schemasResult = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE '%_bu%'
      ORDER BY schema_name;
    `);

    const schemas = schemasResult.rows.map(r => r.schema_name);
    console.log(`✅ ${schemas.length} schéma(s) trouvé(s):\n`);
    
    if (schemas.length === 0) {
      console.log('   ⚠️  Aucun schéma tenant trouvé');
      console.log('   Vérifiez que vos schémas suivent le pattern *_bu*\n');
    } else {
      schemas.forEach(schema => console.log(`   - ${schema}`));
      console.log('');
    }

    // Vérifier le schéma source
    const sourceSchema = '2025_bu01';
    const sourceExists = schemas.includes(sourceSchema);
    
    console.log(`🔍 Vérification du schéma source (${sourceSchema}):`);
    if (sourceExists) {
      console.log(`✅ Schéma source trouvé\n`);
      
      // Compter les fonctions/procédures dans le schéma source
      const objectsResult = await client.query(`
        SELECT 
          COUNT(*) FILTER (WHERE p.prokind = 'f') as functions_count,
          COUNT(*) FILTER (WHERE p.prokind = 'p') as procedures_count
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = $1;
      `, [sourceSchema]);
      
      const counts = objectsResult.rows[0];
      console.log(`📊 Objets dans ${sourceSchema}:`);
      console.log(`   Fonctions: ${counts.functions_count}`);
      console.log(`   Procédures: ${counts.procedures_count}\n`);
      
    } else {
      console.log(`❌ Schéma source introuvable !`);
      console.log(`   Le schéma ${sourceSchema} n'existe pas dans la base\n`);
    }

    // Résumé
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ TOUS LES TESTS SONT PASSÉS\n');
    console.log('Vous pouvez maintenant exécuter:');
    console.log('   npm run sync-db        (pour synchroniser)');
    console.log('   npm run verify-sync    (pour vérifier)\n');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ ERREUR DE CONNEXION\n');
    console.error('Message:', error.message);
    console.error('');
    
    if (error.code === 'ENOTFOUND') {
      console.error('💡 Le serveur est introuvable. Vérifiez:');
      console.error('   - L\'adresse du serveur (DB_HOST)');
      console.error('   - Votre connexion internet');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connexion refusée. Vérifiez:');
      console.error('   - Le port (DB_PORT)');
      console.error('   - Que le serveur PostgreSQL est démarré');
    } else if (error.code === '28P01') {
      console.error('💡 Authentification échouée. Vérifiez:');
      console.error('   - Le nom d\'utilisateur (DB_USER)');
      console.error('   - Le mot de passe (DB_PASSWORD)');
    } else if (error.code === '3D000') {
      console.error('💡 Base de données introuvable. Vérifiez:');
      console.error('   - Le nom de la base (DB_NAME)');
    }
    
    console.error('');
    process.exit(1);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

testConnection();
