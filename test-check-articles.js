// Script pour vérifier les articles existants
const baseUrl = 'http://localhost:3005';
const tenant = '2025_bu01';

const checkArticles = async () => {
  console.log('🔍 Vérification des articles existants\n');
  
  try {
    const response = await fetch(`${baseUrl}/api/articles`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant
      }
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ ${result.data.length} articles trouvés :\n`);
      result.data.slice(0, 10).forEach((article, index) => {
        console.log(`${index + 1}. Code: ${article.narticle || article.Narticle}`);
        console.log(`   Désignation: ${article.designation || article.Designation}`);
        console.log(`   Fournisseur: ${article.nfournisseur || article.Nfournisseur || 'N/A'}`);
        console.log(`   Prix: ${article.prix_unitaire || article.Prix_unitaire || 'N/A'} DA`);
        console.log('');
      });
      
      if (result.data.length > 10) {
        console.log(`... et ${result.data.length - 10} autres articles`);
      }
    } else {
      console.log('❌ Erreur:', result.error);
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
};

checkArticles();
