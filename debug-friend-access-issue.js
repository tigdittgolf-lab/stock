// Diagnostiquer le problème d'accès de votre ami
async function debugFriendAccessIssue() {
  try {
    console.log('🔍 DIAGNOSTIC COMPLET DU PROBLÈME...');
    
    const productionUrl = 'https://frontend-iota-six-72.vercel.app';
    const tenant = '2025_bu01';
    
    console.log(`📊 URL: ${productionUrl}`);
    console.log(`🏢 Tenant: ${tenant}`);
    console.log('=' .repeat(70));
    
    // 1. Test Articles (CRITIQUE pour dropdown)
    console.log('\n📦 1. TEST ARTICLES (pour dropdown BL)');
    try {
      const articlesResponse = await fetch(`${productionUrl}/api/articles`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status articles:', articlesResponse.status);
      
      if (articlesResponse.status === 200) {
        const articlesData = await articlesResponse.json();
        console.log('✅ Articles trouvés:', articlesData.data?.length || 0);
        
        if (articlesData.data && articlesData.data.length > 0) {
          console.log('📋 Articles disponibles:');
          articlesData.data.slice(0, 3).forEach((article, index) => {
            console.log(`   ${index + 1}. ${article.narticle} - ${article.designation} - ${article.prix_vente} DA`);
          });
        } else {
          console.log('❌ PROBLÈME: Aucun article trouvé !');
        }
      } else {
        console.log('❌ ERREUR ARTICLES:', articlesResponse.status);
        const errorText = await articlesResponse.text();
        console.log('Erreur:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ ERREUR ARTICLES:', error.message);
    }
    
    // 2. Test Clients (CRITIQUE pour dropdown BL)
    console.log('\n👥 2. TEST CLIENTS (pour dropdown BL)');
    try {
      const clientsResponse = await fetch(`${productionUrl}/api/clients`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status clients:', clientsResponse.status);
      
      if (clientsResponse.status === 200) {
        const clientsData = await clientsResponse.json();
        console.log('✅ Clients trouvés:', clientsData.data?.length || 0);
        
        if (clientsData.data && clientsData.data.length > 0) {
          console.log('📋 Clients disponibles:');
          clientsData.data.slice(0, 3).forEach((client, index) => {
            console.log(`   ${index + 1}. ${client.nclient} - ${client.raison_sociale || client.nom_client}`);
          });
        } else {
          console.log('❌ PROBLÈME: Aucun client trouvé !');
        }
      } else {
        console.log('❌ ERREUR CLIENTS:', clientsResponse.status);
        const errorText = await clientsResponse.text();
        console.log('Erreur:', errorText.substring(0, 200));
      }
    } catch (error) {
      console.log('❌ ERREUR CLIENTS:', error.message);
    }
    
    // 3. Test Fournisseurs
    console.log('\n🏭 3. TEST FOURNISSEURS');
    try {
      const suppliersResponse = await fetch(`${productionUrl}/api/suppliers`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status fournisseurs:', suppliersResponse.status);
      
      if (suppliersResponse.status === 200) {
        const suppliersData = await suppliersResponse.json();
        console.log('✅ Fournisseurs trouvés:', suppliersData.data?.length || 0);
      } else {
        console.log('❌ ERREUR FOURNISSEURS:', suppliersResponse.status);
      }
    } catch (error) {
      console.log('❌ ERREUR FOURNISSEURS:', error.message);
    }
    
    // 4. Test Dashboard (ce que votre ami voit)
    console.log('\n📊 4. TEST DASHBOARD (ce que votre ami voit)');
    try {
      const dashboardResponse = await fetch(`${productionUrl}/api/sales/dashboard`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status dashboard:', dashboardResponse.status);
      
      if (dashboardResponse.status === 200) {
        const dashboardData = await dashboardResponse.json();
        console.log('✅ Dashboard accessible');
        console.log('📋 Données dashboard:', JSON.stringify(dashboardData, null, 2));
      } else {
        console.log('❌ ERREUR DASHBOARD:', dashboardResponse.status);
      }
    } catch (error) {
      console.log('❌ ERREUR DASHBOARD:', error.message);
    }
    
    // 5. Test direct backend (pour comparaison)
    console.log('\n🔧 5. TEST BACKEND DIRECT');
    try {
      const backendResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/articles', {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status backend direct:', backendResponse.status);
      
      if (backendResponse.status === 200) {
        const backendData = await backendResponse.json();
        console.log('✅ Backend articles:', backendData.data?.length || 0);
      }
    } catch (error) {
      console.log('❌ ERREUR BACKEND:', error.message);
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 DIAGNOSTIC:');
    console.log('Si articles/clients retournent 404 ou 0 résultats,');
    console.log('alors le problème est dans les routes API frontend');
    console.log('qui ne redirigent pas correctement vers le backend.');
    console.log('\n🔧 SOLUTION: Corriger les routes API frontend');
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
}

debugFriendAccessIssue();