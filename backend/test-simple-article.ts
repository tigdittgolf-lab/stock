import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseClient.js';

async function testSimpleArticle() {
  console.log('🔍 Testing simple article creation...\n');

  // Utiliser une famille qui existe déjà (d'après les données que nous avons vues)
  console.log('1. Testing article creation with "Electricité" family...');
  
  try {
    const { data, error } = await supabaseAdmin.rpc('insert_article_to_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: 'TEST003',
      p_famille: 'Electricité',  // Famille qui existe déjà
      p_designation: 'Article de test électricité',
      p_nfournisseur: null,
      p_prix_unitaire: 100.00,
      p_marge: 20.00,
      p_tva: 19.00,
      p_prix_vente: 142.80,
      p_seuil: 10,
      p_stock_f: 50,
      p_stock_bl: 60
    });
    
    if (error) {
      console.log('❌ Error creating article:', error.message);
    } else {
      console.log('✅ Article created successfully:', data);
      
      // Vérifier que l'article est maintenant dans la base
      console.log('\n2. Verifying article in database...');
      const { data: articles, error: getError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
        p_tenant: '2025_bu01'
      });
      
      if (getError) {
        console.log('❌ Error getting articles:', getError.message);
      } else {
        console.log(`✅ Total articles in database: ${articles?.length || 0}`);
        const testArticle = articles?.find((a: any) => a.narticle === 'TEST003');
        if (testArticle) {
          console.log('✅ TEST003 article found in database:', testArticle);
        } else {
          console.log('❌ TEST003 article not found in database');
          console.log('   Available articles:', articles?.map((a: any) => a.narticle) || []);
        }
      }
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

testSimpleArticle();