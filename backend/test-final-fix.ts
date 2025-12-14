// Test final après nettoyage
// Exécuter avec: bun run test-final-fix.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testFinalFix() {
  console.log('🧪 Testing after cleaning and fixing...\n');

  try {
    // Test avec "1000" (sans espace)
    const { data: article, error } = await supabase.rpc('get_article_by_id_from_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: '1000'
    });

    if (error) {
      console.error('❌ Error:', error);
    } else if (article && article.length > 0) {
      console.log('✅ SUCCESS! Article 1000 found:');
      console.log(`   ID: "${article[0].narticle}" (length: ${article[0].narticle.length})`);
      console.log(`   Designation: ${article[0].designation}`);
      console.log('\n🎉 La page de modification devrait maintenant fonctionner parfaitement !');
    } else {
      console.log('❌ Article still not found');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testFinalFix();