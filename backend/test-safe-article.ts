import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseClient.js';

async function testSafeArticle() {
  console.log('🔍 Testing safe article creation...\n');

  console.log('⚠️  IMPORTANT: Execute fix-famille-constraint.sql in Supabase first!\n');

  // Test avec une famille qui n'existe pas encore
  console.log('1. Testing article creation with new family "TestFamily"...');
  
  try {
    const { data, error } = await supabaseAdmin.rpc('insert_article_to_tenant_safe', {
      p_tenant: '2025_bu01',
      p_narticle: 'TEST005',
      p_famille: 'TestFamily',
      p_designation: 'Article avec nouvelle famille',
      p_nfournisseur: null,
      p_prix_unitaire: 150.00,
      p_marge: 25.00,
      p_tva: 19.00,
      p_prix_vente: 223.13,
      p_seuil: 5,
      p_stock_f: 30,
      p_stock_bl: 35
    });
    
    if (error) {
      console.log('❌ Error (function may not exist yet):', error.message);
      console.log('   → Execute fix-famille-constraint.sql in Supabase first!');
    } else {
      console.log('✅ Article created successfully:', data);
      
      // Vérifier que l'article est dans la base
      console.log('\n2. Verifying article in database...');
      const { data: articles, error: getError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
        p_tenant: '2025_bu01'
      });
      
      if (getError) {
        console.log('❌ Error getting articles:', getError.message);
      } else {
        console.log(`✅ Total articles in database: ${articles?.length || 0}`);
        const testArticle = articles?.find((a: any) => a.narticle === 'TEST005');
        if (testArticle) {
          console.log('✅ TEST005 article found in database:', testArticle);
        } else {
          console.log('❌ TEST005 article not found in database');
        }
      }
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

testSafeArticle();