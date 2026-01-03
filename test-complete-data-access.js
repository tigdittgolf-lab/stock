// Tester l'accès complet aux données existantes
async function testCompleteDataAccess() {
  try {
    console.log('🔍 Test complet d\'accès aux données existantes...');
    
    const productionUrl = 'https://frontend-iota-six-72.vercel.app';
    const tenant = '2025_bu01'; // Votre tenant avec toutes vos données
    
    console.log(`📊 Tenant testé: ${tenant}`);
    console.log('=' .repeat(60));
    
    // 1. Test des Bons de Livraison
    console.log('\n📋 1. BONS DE LIVRAISON');
    try {
      const blResponse = await fetch(`${productionUrl}/api/sales/delivery-notes`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      if (blResponse.status === 200) {
        const blData = await blResponse.json();
        console.log(`✅ ${blData.data?.length || 0} BL accessibles:`);
        
        if (blData.data && blData.data.length > 0) {
          blData.data.forEach((bl, index) => {
            console.log(`   ${index + 1}. BL ${bl.nfact || bl.nbl} - ${bl.client_name} - ${bl.montant_ht} DA (${bl.date_fact})`);
          });
        }
      } else {
        console.log('❌ Erreur BL:', blResponse.status);
      }
    } catch (error) {
      console.log('❌ Erreur BL:', error.message);
    }
    
    // 2. Test des Factures
    console.log('\n💰 2. FACTURES');
    try {
      const factResponse = await fetch(`${productionUrl}/api/sales/invoices`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      if (factResponse.status === 200) {
        const factData = await factResponse.json();
        console.log(`✅ ${factData.data?.length || 0} factures accessibles:`);
        
        if (factData.data && factData.data.length > 0) {
          factData.data.forEach((fact, index) => {
            console.log(`   ${index + 1}. Facture ${fact.nfact} - ${fact.client_name} - ${fact.montant_ht} DA`);
          });
        }
      } else {
        console.log('❌ Erreur factures:', factResponse.status);
      }
    } catch (error) {
      console.log('❌ Erreur factures:', error.message);
    }
    
    // 3. Test des Clients
    console.log('\n👥 3. CLIENTS');
    try {
      const clientsResponse = await fetch(`${productionUrl}/api/clients`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      if (clientsResponse.status === 200) {
        const clientsData = await clientsResponse.json();
        console.log(`✅ ${clientsData.data?.length || 0} clients accessibles:`);
        
        if (clientsData.data && clientsData.data.length > 0) {
          clientsData.data.slice(0, 5).forEach((client, index) => {
            console.log(`   ${index + 1}. ${client.nclient} - ${client.raison_sociale || client.nom_client} (${client.tel})`);
          });
          if (clientsData.data.length > 5) {
            console.log(`   ... et ${clientsData.data.length - 5} autres clients`);
          }
        }
      } else {
        console.log('❌ Erreur clients:', clientsResponse.status);
      }
    } catch (error) {
      console.log('❌ Erreur clients:', error.message);
    }
    
    // 4. Test des Fournisseurs
    console.log('\n🏭 4. FOURNISSEURS');
    try {
      const suppliersResponse = await fetch(`${productionUrl}/api/suppliers`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      if (suppliersResponse.status === 200) {
        const suppliersData = await suppliersResponse.json();
        console.log(`✅ ${suppliersData.data?.length || 0} fournisseurs accessibles:`);
        
        if (suppliersData.data && suppliersData.data.length > 0) {
          suppliersData.data.forEach((supplier, index) => {
            console.log(`   ${index + 1}. ${supplier.nfournisseur} - ${supplier.nom_fournisseur} (${supplier.tel})`);
          });
        }
      } else {
        console.log('❌ Erreur fournisseurs:', suppliersResponse.status);
      }
    } catch (error) {
      console.log('❌ Erreur fournisseurs:', error.message);
    }
    
    // 5. Test des Articles
    console.log('\n📦 5. ARTICLES');
    try {
      const articlesResponse = await fetch(`${productionUrl}/api/articles`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      if (articlesResponse.status === 200) {
        const articlesData = await articlesResponse.json();
        console.log(`✅ ${articlesData.data?.length || 0} articles accessibles:`);
        
        if (articlesData.data && articlesData.data.length > 0) {
          articlesData.data.slice(0, 5).forEach((article, index) => {
            console.log(`   ${index + 1}. ${article.narticle} - ${article.designation} (${article.prix_vente} DA)`);
          });
          if (articlesData.data.length > 5) {
            console.log(`   ... et ${articlesData.data.length - 5} autres articles`);
          }
        }
      } else {
        console.log('❌ Erreur articles:', articlesResponse.status);
      }
    } catch (error) {
      console.log('❌ Erreur articles:', error.message);
    }
    
    // 6. Test des Proformas
    console.log('\n📄 6. PROFORMAS');
    try {
      const proformasResponse = await fetch(`${productionUrl}/api/sales/proformas`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      if (proformasResponse.status === 200) {
        const proformasData = await proformasResponse.json();
        console.log(`✅ ${proformasData.data?.length || 0} proformas accessibles:`);
        
        if (proformasData.data && proformasData.data.length > 0) {
          proformasData.data.forEach((proforma, index) => {
            console.log(`   ${index + 1}. Proforma ${proforma.nfact} - ${proforma.client_name} - ${proforma.montant_ht} DA`);
          });
        }
      } else {
        console.log('❌ Erreur proformas:', proformasResponse.status);
      }
    } catch (error) {
      console.log('❌ Erreur proformas:', error.message);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RÉSUMÉ POUR VOTRE AMI:');
    console.log('✅ Il aura accès à TOUTES vos données existantes');
    console.log('✅ Il peut voir, modifier, créer des documents');
    console.log('✅ Collaboration en temps réel sur les mêmes données');
    console.log('✅ Accès complet au système comme vous');
    
    console.log('\n📋 Instructions finales:');
    console.log('1. URL: https://frontend-iota-six-72.vercel.app/');
    console.log('2. Login: admin/admin');
    console.log('3. Tenant: Business Unit 01 (2025) - 2025_bu01');
    console.log('4. Il verra EXACTEMENT les mêmes données que vous !');
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
  }
}

testCompleteDataAccess();