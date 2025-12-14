// Script pour vraiment vider la base de données avec la fonction corrigée
import { supabaseAdmin } from './src/supabaseClient.js';

async function reallyCleanDatabase() {
  console.log('🧹 VIDAGE RÉEL DE LA BASE DE DONNÉES');
  console.log('===================================\n');
  
  const tenant = '2025_bu01';
  const tables = ['article', 'client', 'fournisseur', 'famille_art'];
  
  try {
    // 1. Utiliser la nouvelle fonction truncate_table
    console.log('🗑️ Vidage avec TRUNCATE...');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.rpc('truncate_table', {
          p_schema: tenant,
          p_table: table
        });
        
        if (error) {
          console.log(`❌ Erreur TRUNCATE ${table}:`, error.message);
        } else {
          console.log(`✅ ${data}`);
        }
      } catch (e) {
        console.log(`⚠️  TRUNCATE ${table}: ${e.message}`);
      }
    }
    
    // 2. Vérifier avec la fonction exec_sql corrigée
    console.log('\n🔍 Vérification avec SELECT...');
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin.rpc('exec_sql', {
          sql: `SELECT COUNT(*) as count FROM "${tenant}".${table};`
        });
        
        if (error) {
          console.log(`❌ Erreur SELECT ${table}:`, error.message);
        } else {
          const count = data?.[0]?.count || 0;
          console.log(`📊 ${table}: ${count} lignes`);
        }
      } catch (e) {
        console.log(`⚠️  SELECT ${table}: ${e.message}`);
      }
    }
    
    // 3. Test direct de get_articles_by_tenant
    console.log('\n🧪 Test RPC get_articles_by_tenant...');
    
    try {
      const { data: articles, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
        p_tenant: tenant
      });
      
      if (error) {
        console.log('❌ Erreur RPC:', error.message);
      } else {
        console.log(`📊 Articles via RPC: ${articles?.length || 0}`);
        if (articles && articles.length > 0) {
          console.log('⚠️  ATTENTION: Il reste des articles !');
          articles.forEach((article: any) => {
            console.log(`   - ${article.narticle}: ${article.designation}`);
          });
        } else {
          console.log('✅ Aucun article trouvé - base vraiment vide !');
        }
      }
    } catch (e) {
      console.log('⚠️  RPC error:', e.message);
    }
    
    console.log('\n🎯 RÉSULTAT FINAL:');
    if (articles?.length === 0) {
      console.log('🎉 SUCCÈS ! Base de données complètement vide');
      console.log('✅ L\'application devrait maintenant afficher 0 articles');
    } else {
      console.log('❌ ÉCHEC ! Il reste encore des données');
      console.log('🔧 Essayons une approche plus radicale...');
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

reallyCleanDatabase();