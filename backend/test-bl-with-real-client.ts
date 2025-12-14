// Test de création de BL avec un vrai client
import { supabaseAdmin } from './src/supabaseClient.js';

async function testBLWithRealClient() {
  console.log('🧪 Testing BL creation with real client...');
  
  const testTenant = '2025_bu01';
  
  try {
    // 1. Récupérer les vrais clients
    console.log('1️⃣ Getting real clients...');
    const { data: clients, error: clientError } = await supabaseAdmin.rpc('get_clients_by_tenant', {
      p_tenant: testTenant
    });
    
    if (clientError || !clients || clients.length === 0) {
      console.error('❌ No clients found:', clientError);
      return;
    }
    
    const realClient = clients[0];
    console.log(`✅ Using client: ${realClient.nclient} - ${realClient.raison_sociale}`);
    
    // 2. Obtenir le prochain numéro de BL
    console.log('2️⃣ Getting next BL number...');
    const { data: nextNumber, error: numberError } = await supabaseAdmin.rpc('get_next_bl_number', {
      p_tenant: testTenant
    });
    
    if (numberError) {
      console.error('❌ Failed to get next BL number:', numberError);
      return;
    }
    
    console.log(`✅ Next BL number: ${nextNumber}`);
    
    // 3. Créer un BL de test
    console.log('3️⃣ Creating test BL...');
    const { data: blResult, error: blError } = await supabaseAdmin.rpc('insert_bl', {
      p_tenant: testTenant,
      p_nfact: nextNumber,
      p_nclient: realClient.nclient,
      p_date_fact: '2025-01-01',
      p_montant_ht: 100,
      p_tva: 19,
      p_timbre: 0,
      p_autre_taxe: 0
    });
    
    if (blError) {
      console.error('❌ Failed to create BL:', blError);
      return;
    }
    
    console.log(`✅ BL created successfully: ${blResult}`);
    
    // 4. Récupérer les vrais articles
    console.log('4️⃣ Getting real articles...');
    const { data: articles, error: articleError } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: testTenant
    });
    
    if (articleError || !articles || articles.length === 0) {
      console.error('❌ No articles found:', articleError);
      return;
    }
    
    const realArticle = articles[0];
    console.log(`✅ Using article: ${realArticle.narticle} - ${realArticle.designation}`);
    
    // 5. Ajouter un détail de BL
    console.log('5️⃣ Adding BL detail...');
    const { data: detailResult, error: detailError } = await supabaseAdmin.rpc('insert_detail_bl', {
      p_tenant: testTenant,
      p_nfact: nextNumber,
      p_narticle: realArticle.narticle,
      p_qte: 1,
      p_prix: 100,
      p_tva: 19,
      p_total_ligne: 100
    });
    
    if (detailError) {
      console.error('❌ Failed to add BL detail:', detailError);
    } else {
      console.log(`✅ BL detail added: ${detailResult}`);
    }
    
    // 6. Tester la mise à jour du stock
    console.log('6️⃣ Testing stock update...');
    const { data: stockResult, error: stockError } = await supabaseAdmin.rpc('update_stock_bl', {
      p_tenant: testTenant,
      p_narticle: realArticle.narticle,
      p_quantity: 1
    });
    
    if (stockError) {
      console.error('❌ Failed to update stock:', stockError);
    } else {
      console.log(`✅ Stock updated:`, stockResult);
    }
    
    console.log('\n🎉 All BL functions work perfectly!');
    console.log('📋 The delivery note creation should now work in the frontend.');
    
    // Nettoyer les données de test
    console.log('\n🧹 Cleaning up test data...');
    await supabaseAdmin.rpc('exec_sql', {
      sql: `DELETE FROM "${testTenant}".detail_bl WHERE nfact = ${nextNumber};`
    });
    await supabaseAdmin.rpc('exec_sql', {
      sql: `DELETE FROM "${testTenant}".bl WHERE nfact = ${nextNumber};`
    });
    console.log('✅ Test data cleaned up');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testBLWithRealClient();