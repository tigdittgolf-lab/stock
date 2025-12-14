// Script pour ajouter des articles de test dans la nouvelle base de données
import { supabaseAdmin } from './src/supabaseClient.js';

async function addSampleArticles() {
  console.log('📦 AJOUT D\'ARTICLES DE TEST');
  console.log('============================\n');
  
  const sampleArticles = [
    {"narticle": "112", "designation": "lampe 12v", "famille": "Electricité", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": 120.00, "marge": 15, "tva": 19.00, "prix_vente": 164.28, "seuil": 10, "stock_f": 120, "stock_bl": 133},
    {"narticle": "121", "designation": "drog1", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": 120.00, "marge": 15, "tva": 19.00, "prix_vente": 164.28, "seuil": 10, "stock_f": 120, "stock_bl": 133},
    {"narticle": "122", "designation": "drog2", "famille": "Droguerie", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": 150.00, "marge": 30, "tva": 19.00, "prix_vente": 232.05, "seuil": 15, "stock_f": 80, "stock_bl": 95},
    {"narticle": "131", "designation": "peinture blanche", "famille": "Peinture", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": 180.00, "marge": 20, "tva": 19.00, "prix_vente": 257.04, "seuil": 12, "stock_f": 45, "stock_bl": 50},
    {"narticle": "141", "designation": "marteau 500g", "famille": "Outillage", "nfournisseur": "FOURNISSEUR 1", "prix_unitaire": 80.00, "marge": 40, "tva": 19.00, "prix_vente": 133.28, "seuil": 8, "stock_f": 25, "stock_bl": 30}
  ];
  
  const tenant = '2025_bu01';
  
  for (const article of sampleArticles) {
    console.log(`📝 Ajout de l'article: ${article.narticle} - ${article.designation}`);
    
    try {
      const { data, error } = await supabaseAdmin.rpc('insert_article_to_tenant', {
        p_tenant: tenant,
        p_narticle: article.narticle,
        p_famille: article.famille,
        p_designation: article.designation,
        p_nfournisseur: article.nfournisseur,
        p_prix_unitaire: article.prix_unitaire,
        p_marge: article.marge,
        p_tva: article.tva,
        p_prix_vente: article.prix_vente,
        p_seuil: article.seuil,
        p_stock_f: article.stock_f,
        p_stock_bl: article.stock_bl
      });
      
      if (error) {
        console.error(`❌ Erreur pour ${article.narticle}:`, error.message);
      } else {
        console.log(`✅ ${data}`);
      }
      
    } catch (e) {
      console.error(`❌ Exception pour ${article.narticle}:`, e.message);
    }
  }
  
  // Vérification
  console.log('\n🔍 Vérification des articles ajoutés...');
  
  try {
    const { data: articles, error } = await supabaseAdmin.rpc('get_articles_by_tenant', {
      p_tenant: tenant
    });
    
    if (error) {
      console.error('❌ Erreur vérification:', error.message);
    } else {
      console.log(`✅ Total articles dans ${tenant}: ${articles?.length || 0}`);
      articles?.forEach((article: any) => {
        console.log(`   - ${article.narticle}: ${article.designation}`);
      });
    }
  } catch (e) {
    console.error('❌ Exception vérification:', e.message);
  }
  
  console.log('\n🎉 AJOUT TERMINÉ !');
  console.log('==================');
  console.log('✅ Articles de test ajoutés');
  console.log('✅ Redémarrez le serveur backend');
  console.log('✅ Testez l\'application');
}

addSampleArticles();