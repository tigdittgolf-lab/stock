/**
 * Vérifier les données dans le schéma tenant 2025_bu01
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const schemaName = '2025_bu01';
const tables = ['article', 'client', 'fournisseur', 'detail_bl'];

async function main() {
  console.log(`🔍 VÉRIFICATION DES DONNÉES - Schéma: ${schemaName}\n`);
  console.log('='.repeat(70));

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const tableName of tables) {
    console.log(`\n📊 ${tableName}`);
    console.log('-'.repeat(70));

    try {
      // Compter via RPC
      const { data: count, error: countError } = await supabase.rpc(
        'count_tenant_table_records',
        {
          p_schema_name: schemaName,
          p_table_name: tableName
        }
      );

      if (countError) {
        console.log(`  ❌ Erreur: ${countError.message}`);
        continue;
      }

      if (count === 0) {
        console.log(`  ⚪ Table vide (0 enregistrements)`);
      } else {
        console.log(`  ✅ ${count} enregistrements`);

        // Récupérer quelques échantillons
        const { data: records, error: dataError } = await supabase.rpc(
          'get_tenant_table_data',
          {
            p_schema_name: schemaName,
            p_table_name: tableName,
            p_limit: 3,
            p_offset: 0
          }
        );

        if (!dataError && records && records.success && records.data) {
          const samples = records.data;
          console.log(`  📋 Échantillon (${Math.min(3, samples.length)} premiers):`);
          samples.slice(0, 3).forEach((record, index) => {
            const keys = Object.keys(record).slice(0, 3);
            const preview = keys.map(k => `${k}: ${record[k]}`).join(', ');
            console.log(`     ${index + 1}. ${preview}...`);
          });
        }
      }

    } catch (error) {
      console.log(`  ❌ Exception: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n📋 RÉSUMÉ\n');

  let totalWithData = 0;
  let totalEmpty = 0;

  for (const tableName of tables) {
    const { data: count } = await supabase.rpc(
      'count_tenant_table_records',
      {
        p_schema_name: schemaName,
        p_table_name: tableName
      }
    );

    if (count > 0) {
      totalWithData++;
      console.log(`✅ ${tableName}: ${count} enregistrements`);
    } else {
      totalEmpty++;
      console.log(`⚪ ${tableName}: vide`);
    }
  }

  console.log(`\n📊 Total: ${totalWithData} tables avec données, ${totalEmpty} tables vides`);

  if (totalWithData === tables.length) {
    console.log('\n✅ MIGRATION COMPLÈTE - Toutes les tables ont des données!');
  } else if (totalWithData > 0) {
    console.log('\n⚠️  MIGRATION PARTIELLE - Certaines tables sont vides');
  } else {
    console.log('\n❌ MIGRATION ÉCHOUÉE - Toutes les tables sont vides');
  }
}

main();
