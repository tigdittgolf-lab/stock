// Debug pour comprendre le problème avec l'ID de l'article
// Exécuter avec: bun run debug-article-id.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugArticleId() {
  console.log('🔍 Debugging article ID issue...\n');

  try {
    // 1. Récupérer tous les articles pour voir les IDs exacts
    console.log('1️⃣ Getting all articles to see exact IDs...');
    const { data: allArticles, error: allError } = await supabase.rpc('get_articles_by_tenant', {
      p_tenant: '2025_bu01'
    });

    if (allError) {
      console.error('❌ Error:', allError);
      return;
    }

    if (allArticles && allArticles.length > 0) {
      console.log('📋 Articles found:');
      allArticles.forEach((article: any, index: number) => {
        console.log(`   ${index + 1}. ID: "${article.narticle}" (type: ${typeof article.narticle}) - ${article.designation}`);
        console.log(`      Length: ${article.narticle.length} characters`);
        console.log(`      Trimmed: "${article.narticle.trim()}"`);
      });

      // 2. Tester avec l'ID exact trouvé
      const firstArticleId = allArticles[0].narticle;
      console.log(`\n2️⃣ Testing with exact ID: "${firstArticleId}"`);
      
      const { data: specificArticle, error: specificError } = await supabase.rpc('get_article_by_id_from_tenant', {
        p_tenant: '2025_bu01',
        p_narticle: firstArticleId
      });

      if (specificError) {
        console.error('❌ Error with exact ID:', specificError);
      } else if (specificArticle && specificArticle.length > 0) {
        console.log('✅ SUCCESS with exact ID!');
        console.log(specificArticle[0]);
      } else {
        console.log('❌ Still not found with exact ID');
      }

      // 3. Tester avec l'ID trimmed
      const trimmedId = firstArticleId.trim();
      console.log(`\n3️⃣ Testing with trimmed ID: "${trimmedId}"`);
      
      const { data: trimmedArticle, error: trimmedError } = await supabase.rpc('get_article_by_id_from_tenant', {
        p_tenant: '2025_bu01',
        p_narticle: trimmedId
      });

      if (trimmedError) {
        console.error('❌ Error with trimmed ID:', trimmedError);
      } else if (trimmedArticle && trimmedArticle.length > 0) {
        console.log('✅ SUCCESS with trimmed ID!');
        console.log(trimmedArticle[0]);
      } else {
        console.log('❌ Still not found with trimmed ID');
      }

      // 4. Tester différentes variations
      console.log(`\n4️⃣ Testing variations of "1000":`);
      const variations = ['1000', ' 1000', '1000 ', ' 1000 ', '1000.0', '01000'];
      
      for (const variation of variations) {
        const { data: varArticle } = await supabase.rpc('get_article_by_id_from_tenant', {
          p_tenant: '2025_bu01',
          p_narticle: variation
        });
        
        const found = varArticle && varArticle.length > 0;
        console.log(`   "${variation}" -> ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
      }

    } else {
      console.log('⚠️ No articles found');
    }

  } catch (error) {
    console.error('💥 Error:', error);
  }
}

debugArticleId();