import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseClient.js';

async function testWithValidFamily() {
  console.log('🔍 Testing with valid family...\n');

  // D'abord, récupérer les familles existantes
  console.log('1. Getting existing families...');
  try {
    const { data: families, error } = await supabaseAdmin.rpc('get_families_by_tenant', {
      p_tenant: '2025_bu01'
    });
    
    if (error) {
      console.log('❌ Error getting families:', error.message);
      return;
    }
    
    console.log('✅ Available families:', families?.map((f: any) => f.famille) || []);
    
    if (!families || families.length === 0) {
      console.log('❌ No families found. Need to create families first.');
      return;
    }

    // Utiliser la première famille disponible
    const validFamily = families[0].famille;
    console.log(`\n2. Testing article creation with family: "${validFamily}"`);
    
    const { data, error: insertError } = await supabaseAdmin.rpc('insert_article_to_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: 'TEST002',
      p_famille: validFamily,
      p_designation: 'Article de test avec famille valide',
      p_nfournisseur: null,
      p_prix_unitaire: 100.00,
      p_marge: 20.00,
      p_tva: 19.00,
      p_prix_vente: 142.80,
      p_seuil: 10,
      p_stock_f: 50,
      p_stock_bl: 60
    });
    
    if (insertError) {
      console.log('❌ Error creating article:', insertError.message);
    } else {
      console.log('✅ Article created successfully:', data);
      
      // Vérifier que l'article est maintenant dans la base
      console.log('\n3. Verifying article in database...');
      const { data: articles, error: getError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
        p_tenant: '2025_bu01'
      });
      
      if (getError) {
        console.log('❌ Error getting articles:', getError.message);
      } else {
        const testArticle = articles?.find((a: any) => a.narticle === 'TEST002');
        if (testArticle) {
          console.log('✅ Article found in database:', testArticle);
        } else {
          console.log('❌ Article not found in database');
        }
      }
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

testWithValidFamily();