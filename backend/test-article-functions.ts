// Script de test pour les fonctions RPC des articles
// Exécuter avec: bun run test-article-functions.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testArticleFunctions() {
  console.log('🧪 Testing Article RPC Functions...\n');

  const testTenant = '2025_bu01';
  const testArticleId = '1000'; // Remplacez par un ID d'article existant

  try {
    // Test 1: Récupérer tous les articles
    console.log('1️⃣ Testing get_articles_by_tenant...');
    const { data: allArticles, error: allError } = await supabase.rpc('get_articles_by_tenant', {
      p_tenant: testTenant
    });

    if (allError) {
      console.error('❌ Error getting all articles:', allError);
    } else {
      console.log(`✅ Found ${allArticles?.length || 0} articles`);
      if (allArticles && allArticles.length > 0) {
        console.log('📋 First article:', allArticles[0]);
      }
    }

    // Test 2: Récupérer un article spécifique
    console.log('\n2️⃣ Testing get_article_by_id_from_tenant...');
    const { data: specificArticle, error: specificError } = await supabase.rpc('get_article_by_id_from_tenant', {
      p_tenant: testTenant,
      p_narticle: testArticleId
    });

    if (specificError) {
      console.error('❌ Error getting specific article:', specificError);
    } else if (specificArticle && specificArticle.length > 0) {
      console.log('✅ Found specific article:', specificArticle[0]);
    } else {
      console.log(`⚠️ Article ${testArticleId} not found in ${testTenant}`);
    }

    // Test 3: Lister les articles existants pour référence
    console.log('\n3️⃣ Listing existing articles for reference...');
    if (allArticles && allArticles.length > 0) {
      console.log('📋 Available articles:');
      allArticles.forEach((article: any, index: number) => {
        console.log(`   ${index + 1}. ${article.narticle} - ${article.designation}`);
      });
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Exécuter les tests
testArticleFunctions();