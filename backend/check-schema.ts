import 'dotenv/config';
import { supabaseAdmin } from './src/supabaseClient.js';

async function checkSchema() {
  console.log('🔍 Checking schema 2025_bu01...\n');

  try {
    // Vérifier les articles existants
    console.log('1. Checking existing articles...');
    const { data: articles, error: articlesError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: '2025_bu01'
    });
    
    if (articlesError) {
      console.log('❌ Error getting articles:', articlesError.message);
    } else {
      console.log(`✅ Found ${articles?.length || 0} articles in 2025_bu01`);
      if (articles && articles.length > 0) {
        console.log('   Sample article:', articles[0]);
        console.log('   Families in articles:', [...new Set(articles.map((a: any) => a.famille))]);
      }
    }

    // Vérifier les fournisseurs existants
    console.log('\n2. Checking existing suppliers...');
    const { data: suppliers, error: suppliersError } = await supabaseAdmin.rpc('get_suppliers_by_tenant', {
      p_tenant: '2025_bu01'
    });
    
    if (suppliersError) {
      console.log('❌ Error getting suppliers:', suppliersError.message);
    } else {
      console.log(`✅ Found ${suppliers?.length || 0} suppliers in 2025_bu01`);
      if (suppliers && suppliers.length > 0) {
        console.log('   Sample supplier:', suppliers[0]);
      }
    }

    // Essayer de créer un article avec une famille NULL (pas de contrainte)
    console.log('\n3. Testing article creation with NULL family...');
    const { data: createResult, error: createError } = await supabaseAdmin.rpc('insert_article_to_tenant', {
      p_tenant: '2025_bu01',
      p_narticle: 'TEST004',
      p_famille: null,  // Pas de famille pour éviter la contrainte
      p_designation: 'Article test sans famille',
      p_nfournisseur: null,
      p_prix_unitaire: 100.00,
      p_marge: 20.00,
      p_tva: 19.00,
      p_prix_vente: 142.80,
      p_seuil: 10,
      p_stock_f: 50,
      p_stock_bl: 60
    });
    
    if (createError) {
      console.log('❌ Error creating article with NULL family:', createError.message);
    } else {
      console.log('✅ Article with NULL family created:', createResult);
    }
    
  } catch (err) {
    console.log('❌ Unexpected error:', err);
  }
}

checkSchema();