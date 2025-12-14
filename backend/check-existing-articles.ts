// Script pour vérifier les articles existants
// Exécuter avec: bun run check-existing-articles.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkExistingArticles() {
  console.log('🔍 Checking existing articles in 2025_bu01...\n');

  try {
    // Test 1: Vérifier si les fonctions RPC existent
    console.log('1️⃣ Testing if RPC functions exist...');
    const { data: allArticles, error: allError } = await supabase.rpc('get_articles_by_tenant', {
      p_tenant: '2025_bu01'
    });

    if (allError) {
      console.error('❌ RPC function get_articles_by_tenant not found:', allError);
      console.log('🚨 VOUS DEVEZ EXÉCUTER LE SCRIPT SQL DANS SUPABASE !');
      console.log('📁 Fichier: backend/create-all-missing-rpc-functions-fixed.sql');
      return;
    }

    console.log(`✅ RPC function works! Found ${allArticles?.length || 0} articles`);

    // Test 2: Lister tous les articles existants
    if (allArticles && allArticles.length > 0) {
      console.log('\n2️⃣ Articles existants dans 2025_bu01:');
      allArticles.forEach((article: any, index: number) => {
        console.log(`   ${index + 1}. ID: ${article.narticle} - ${article.designation}`);
      });
    } else {
      console.log('\n⚠️ Aucun article trouvé dans 2025_bu01');
      console.log('💡 Vous devez d\'abord créer des articles via /dashboard/add-article');
    }

    // Test 3: Tester la fonction spécifique get_article_by_id_from_tenant
    console.log('\n3️⃣ Testing get_article_by_id_from_tenant function...');
    const { data: specificArticle, error: specificError } = await supabase.rpc('get_article_by_id_from_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: '1000'
    });

    if (specificError) {
      console.error('❌ RPC function get_article_by_id_from_tenant not found:', specificError);
      console.log('🚨 VOUS DEVEZ EXÉCUTER LE SCRIPT SQL DANS SUPABASE !');
    } else if (specificArticle && specificArticle.length > 0) {
      console.log('✅ Article 1000 found:', specificArticle[0]);
    } else {
      console.log('⚠️ Article 1000 not found - normal if it doesn\'t exist');
    }

    // Test 4: Vérifier la structure de la table
    console.log('\n4️⃣ Checking table structure...');
    const { data: tableData, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('*')
      .eq('table_schema', '2025_bu01')
      .eq('table_name', 'article');

    if (tableError) {
      console.error('❌ Error checking table:', tableError);
    } else if (tableData && tableData.length > 0) {
      console.log('✅ Table 2025_bu01.article exists');
    } else {
      console.log('❌ Table 2025_bu01.article does not exist!');
      console.log('🚨 VOUS DEVEZ CRÉER LE SCHÉMA TENANT FIRST !');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Exécuter la vérification
checkExistingArticles();