#!/usr/bin/env bun

/**
 * Script pour appliquer les migrations à toutes les bases de données
 * 
 * Usage:
 *   bun run migrations/apply-to-all-databases.ts
 *   bun run migrations/apply-to-all-databases.ts --database=2025_bu01
 *   bun run migrations/apply-to-all-databases.ts --status
 */

import { MigrationManager } from './migration-manager';

// Configuration MySQL depuis .env
const MYSQL_HOST = process.env.MYSQL_HOST || 'localhost';
const MYSQL_USER = process.env.MYSQL_USER || 'root';
const MYSQL_PASSWORD = process.env.MYSQL_PASSWORD || '';
const MYSQL_PORT = parseInt(process.env.MYSQL_PORT || '3306');

async function main() {
  const args = process.argv.slice(2);
  const targetDatabase = args.find(arg => arg.startsWith('--database='))?.split('=')[1];
  const showStatus = args.includes('--status');

  console.log('🚀 Gestionnaire de Migrations Multi-Bases');
  console.log('=========================================\n');

  const manager = new MigrationManager(
    MYSQL_HOST,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_PORT
  );

  try {
    await manager.connect();

    if (showStatus) {
      // Afficher le statut
      console.log('📊 Statut des migrations:\n');
      const status = await manager.getMigrationStatus();

      for (const [database, info] of Object.entries(status as any)) {
        console.log(`\n📁 ${database}`);
        console.log(`   Total: ${info.total} migrations`);
        console.log(`   ✅ Appliquées: ${info.applied}`);
        console.log(`   ⏳ En attente: ${info.pending}`);
        
        if (info.pending > 0) {
          console.log(`   Migrations en attente:`);
          info.migrations
            .filter((m: any) => !m.applied)
            .forEach((m: any) => {
              console.log(`      - ${m.version}: ${m.description}`);
            });
        }
      }
    } else {
      // Appliquer les migrations
      console.log('🔄 Application des migrations...\n');
      
      const results = await manager.applyAllMigrations(targetDatabase);

      // Résumé
      console.log('\n\n📊 RÉSUMÉ');
      console.log('=========\n');

      const byDatabase = results.reduce((acc, r) => {
        if (!acc[r.database]) {
          acc[r.database] = { success: 0, skipped: 0, failed: 0 };
        }
        if (r.success) {
          if (r.error === 'Déjà appliquée') {
            acc[r.database].skipped++;
          } else {
            acc[r.database].success++;
          }
        } else {
          acc[r.database].failed++;
        }
        return acc;
      }, {} as any);

      for (const [database, stats] of Object.entries(byDatabase)) {
        console.log(`📁 ${database}`);
        console.log(`   ✅ Appliquées: ${(stats as any).success}`);
        console.log(`   ⏭️  Ignorées: ${(stats as any).skipped}`);
        console.log(`   ❌ Échouées: ${(stats as any).failed}`);
      }

      // Erreurs détaillées
      const errors = results.filter(r => !r.success && r.error !== 'Déjà appliquée');
      if (errors.length > 0) {
        console.log('\n\n❌ ERREURS DÉTAILLÉES');
        console.log('====================\n');
        errors.forEach(e => {
          console.log(`${e.database} - Migration ${e.version}:`);
          console.log(`   ${e.error}\n`);
        });
      }

      // Statistiques globales
      const totalSuccess = results.filter(r => r.success && r.error !== 'Déjà appliquée').length;
      const totalSkipped = results.filter(r => r.success && r.error === 'Déjà appliquée').length;
      const totalFailed = results.filter(r => !r.success).length;

      console.log('\n\n🎯 TOTAL GLOBAL');
      console.log('==============');
      console.log(`✅ Migrations appliquées: ${totalSuccess}`);
      console.log(`⏭️  Migrations ignorées: ${totalSkipped}`);
      console.log(`❌ Migrations échouées: ${totalFailed}`);

      if (totalFailed === 0) {
        console.log('\n🎉 Toutes les migrations ont été appliquées avec succès!');
      } else {
        console.log('\n⚠️  Certaines migrations ont échoué. Vérifiez les erreurs ci-dessus.');
        process.exit(1);
      }
    }

  } catch (error) {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  } finally {
    await manager.disconnect();
  }
}

main();
