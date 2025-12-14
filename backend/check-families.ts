import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseClient.js';

async function checkFamilies() {
  console.log('🔍 Checking families in database...\n');

  try {
    // Vérifier directement dans la table famille_art du schéma 2025_bu01
    const { data, error } = await supabaseAdmin
      .from('famille_art')
      .select('*')
      .schema('2025_bu01');
    
    if (error) {
      console.log('❌ Error accessing famille_art table:', error.message);
      
      // Essayer avec une requête SQL directe
      console.log('\n🔍 Trying direct SQL query...');
      const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('exec_sql', {
        sql_query: 'SELECT * FROM "2025_bu01".famille_art LIMIT 10'
      });
      
      if (sqlError) {
        console.log('❌ SQL query error:', sqlError.message);
      } else {
        console.log('✅ Families from SQL:', sqlData);
      }
    } else {
      console.log('✅ Families found:', data);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

checkFamilies();