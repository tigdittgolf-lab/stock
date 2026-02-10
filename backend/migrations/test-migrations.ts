#!/usr/bin/env bun

/**
 * Script de test du système de migrations
 */

import { MigrationManager } from './migration-manager';

const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');

async function test() {
  console.log('🧪 Test du système de migrations\n');

  const manager = new MigrationManager(
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_PORT
  );

  try {
    await manager.connect();

    // Test 1: Lister les bases de données
    console.log('📊 Test 1: Lister les bases de données');
    const databases = await manager.getAllDatabases();
    console.log(`   Trouvées: ${databases.length} bases`);
    databases.forEach(db => console.log(`   - ${db}`));

    // Test 2: Charger les migrations
    console.log('\n📦 Test 2: Charger les migrations');
    const migrations = await manager.loadMigrations();
    console.log(`   Trouvées: ${migrations.length} migrations`);
    migrations.forEach(m => console.log(`   - ${m.version}: ${m.description}`));

    // Test 3: Vérifier le statut
    console.log('\n📊 Test 3: Statut des migrations');
    const status = await manager.getMigrationStatus();
    
    for (const [database, info] of Object.entries(status as any)) {
      console.log(`\n   ${database}:`);
      console.log(`      Total: ${info.total}`);
      console.log(`      Appliquées: ${info.applied}`);
      console.log(`      En attente: ${info.pending}`);
    }

    console.log('\n✅ Tous les tests ont réussi!');

  } catch (error) {
    console.error('\n❌ Erreur:', error);
    process.exit(1);
  } finally {
    await manager.disconnect();
  }
}

test();
