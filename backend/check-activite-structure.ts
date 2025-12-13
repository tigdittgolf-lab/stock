// Script pour vérifier la structure de la table activite
import { supabaseAdmin } from './src/supabaseClient.js';

async function checkActiviteStructure() {
  console.log('🔍 Checking activite table structure...\n');

  try {
    // Vérifier la structure de la table
    const { data, error } = await supabaseAdmin
      .from('activite')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying activite table:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('⚠️ No data found in activite table');
      return;
    }

    console.log('✅ Activite table data:');
    console.log(JSON.stringify(data[0], null, 2));

    console.log('\n📋 Available columns:');
    Object.keys(data[0]).forEach(column => {
      console.log(`  - ${column}: ${typeof data[0][column]} = "${data[0][column]}"`);
    });

  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

// Run the check
checkActiviteStructure();