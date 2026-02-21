/**
 * Vérification directe via execute_raw_sql
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://szgodrjglbpzkrksnroi.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';

const schemaName = '2025_bu01';
const tables = ['article', 'client', 'fournisseur'];

async function main() {
  console.log('🔍 VÉRIFICATION DIRECTE VIA SQL\n');
  console.log('='.repeat(70));

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const table of tables) {
    console.log(`\n📊 ${table}`);
    
    // Compter via SQL direct
    const countSQL = `SELECT COUNT(*) as count FROM "${schemaName}"."${table}"`;
    const { data: countData, error: countError } = await supabase.rpc('execute_raw_sql', {
      p_sql: countSQL
    });

    if (countError) {
      console.log(`  ❌ Erreur: ${countError.message}`);
    } else if (countData && countData.success) {
      console.log(`  ✅ Comptage réussi`);
    } else {
      console.log(`  ⚠️  Résultat:`, countData);
    }

    // Lire les données via SQL direct
    const selectSQL = `SELECT * FROM "${schemaName}"."${table}" LIMIT 3`;
    const { data: selectData, error: selectError } = await supabase.rpc('execute_raw_sql', {
      p_sql: selectSQL
    });

    if (selectError) {
      console.log(`  ❌ Erreur lecture: ${selectError.message}`);
    } else if (selectData && selectData.success) {
      console.log(`  ✅ Lecture réussie`);
    } else {
      console.log(`  ⚠️  Résultat lecture:`, selectData);
    }
  }
}

main();
