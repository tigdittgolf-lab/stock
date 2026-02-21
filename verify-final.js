/**
 * Vérification finale avec la fonction mise à jour
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const schemaName = '2025_bu01';
const tables = ['article', 'client', 'fournisseur'];

async function main() {
  console.log('🔍 VÉRIFICATION FINALE DES DONNÉES MIGRÉES\n');
  console.log('='.repeat(70));

  const supabase = createClient(supabaseUrl, supabaseKey);

  let totalRecords = 0;

  for (const table of tables) {
    console.log(`\n📊 ${table}`);
    console.log('-'.repeat(70));
    
    // Compter
    const countSQL = `SELECT COUNT(*) as count FROM "${schemaName}"."${table}"`;
    const { data: countData, error: countError } = await supabase.rpc('execute_raw_sql', {
      p_sql: countSQL
    });

    if (countError) {
      console.log(`  ❌ Erreur: ${countError.message}`);
      continue;
    }

    if (countData && countData.success && countData.data && countData.data.length > 0) {
      const count = countData.data[0].count;
      totalRecords += parseInt(count);
      
      if (count === 0) {
        console.log(`  ⚪ Table vide (0 enregistrements)`);
      } else {
        console.log(`  ✅ ${count} enregistrement(s)`);

        // Lire quelques échantillons
        const selectSQL = `SELECT * FROM "${schemaName}"."${table}" LIMIT 2`;
        const { data: selectData, error: selectError } = await supabase.rpc('execute_raw_sql', {
          p_sql: selectSQL
        });

        if (!selectError && selectData && selectData.success && selectData.data) {
          console.log(`  📋 Échantillon:`);
          selectData.data.forEach((record, index) => {
            const keys = Object.keys(record).slice(0, 3);
            const preview = keys.map(k => `${k}: ${record[k]}`).join(', ');
            console.log(`     ${index + 1}. ${preview}...`);
          });
        }
      }
    } else {
      console.log(`  ⚠️  Impossible de compter`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📊 RÉSUMÉ FINAL\n');
  
  console.log(`🎯 Total: ${totalRecords} enregistrements dans Supabase`);
  
  if (totalRecords === 3) {
    console.log('\n✅ MIGRATION COMPLÈTE ET RÉUSSIE!');
    console.log('\n💡 La migration MySQL → Supabase est maintenant À JOUR');
    console.log('\n🚀 Prochaines étapes:');
    console.log('  1. Tester le dashboard: http://100.85.136.96:3000/dashboard');
    console.log('  2. Vérifier que les données s\'affichent correctement');
    console.log('  3. Tester sur smartphone via Tailscale ou déployer sur Vercel');
  } else if (totalRecords > 0) {
    console.log('\n⚠️  MIGRATION PARTIELLE');
    console.log(`   Attendu: 3 enregistrements, Trouvé: ${totalRecords}`);
  } else {
    console.log('\n❌ AUCUNE DONNÉE TROUVÉE');
    console.log('   La migration a peut-être échoué');
  }
}

main();
