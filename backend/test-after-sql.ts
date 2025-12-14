// Test après exécution du SQL
// Exécuter avec: bun run test-after-sql.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAfterSQL() {
  console.log('🧪 Testing get_article_by_id_from_tenant after SQL execution...\n');

  try {
    const { data: specificArticle, error: specificError } = await supabase.rpc('get_article_by_id_from_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: '1000'
    });

    if (specificError) {
      console.error('❌ Function still not working:', specificError);
      console.log('🚨 Vérifiez que vous avez bien exécuté le script SQL dans Supabase !');
    } else if (specificArticle && specificArticle.length > 0) {
      console.log('✅ SUCCESS! Article 1000 found:');
      console.log(specificArticle[0]);
      console.log('\n🎉 La page de modification devrait maintenant fonctionner !');
    } else {
      console.log('⚠️ Function works but article 1000 not found');
      console.log('💡 L\'article existe peut-être avec un autre ID');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testAfterSQL();