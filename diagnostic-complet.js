// Diagnostic complet du système de switch de base de données
async function diagnosticComplet() {
  console.log('🔍 DIAGNOSTIC COMPLET DU SYSTÈME DE SWITCH');
  console.log('='.repeat(60));
  
  try {
    // 1. Vérifier l'état du backend
    console.log('\n1️⃣ ÉTAT DU BACKEND:');
    const backendCurrentResponse = await fetch('http://localhost:3005/api/database/current');
    const backendCurrentData = await backendCurrentResponse.json();
    console.log('   📊 Type backend actuel:', backendCurrentData.currentType);
    
    // 2. Forcer le switch backend vers MySQL
    console.log('\n2️⃣ FORCER SWITCH BACKEND VERS MYSQL:');
    const backendSwitchResponse = await fetch('http://localhost:3005/api/database/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'mysql',
        config: {
          name: 'MySQL Local',
          host: 'localhost',
          port: 3306,
          database: '2025_bu01',
          username: 'root',
          password: ''
        }
      })
    });
    const backendSwitchData = await backendSwitchResponse.json();
    console.log('   🔄 Switch backend:', backendSwitchData.success ? 'OK' : 'FAILED');
    console.log('   📊 Nouveau type backend:', backendSwitchData.currentType);
    
    // 3. Tester TOUTES les routes backend
    console.log('\n3️⃣ TEST TOUTES LES ROUTES BACKEND:');
    const routes = [
      { name: 'Articles', url: '/api/articles' },
      { name: 'Clients', url: '/api/clients' },
      { name: 'Fournisseurs', url: '/api/suppliers' },
      { name: 'Familles', url: '/api/settings/families' },
      { name: 'BL', url: '/api/sales/delivery-notes' },
      { name: 'Factures', url: '/api/sales/invoices' }
    ];
    
    for (const route of routes) {
      try {
        const response = await fetch(`http://localhost:3005${route.url}`, {
          headers: { 'X-Tenant': '2025_bu01' }
        });
        const data = await response.json();
        console.log(`   ${route.name.padEnd(12)}: ${data.data?.length || 0} items (DB: ${data.database_type || 'undefined'})`);
      } catch (error) {
        console.log(`   ${route.name.padEnd(12)}: ERROR - ${error.message}`);
      }
    }
    
    // 4. Vérifier les appels frontend
    console.log('\n4️⃣ TEST APPELS FRONTEND:');
    const frontendRoutes = [
      { name: 'Articles', url: '/api/articles' },
      { name: 'Clients', url: '/api/clients' },
      { name: 'Fournisseurs', url: '/api/suppliers' },
      { name: 'Sales Suppliers', url: '/api/sales/suppliers' }
    ];
    
    for (const route of frontendRoutes) {
      try {
        const response = await fetch(`http://localhost:3000${route.url}`, {
          headers: { 'X-Tenant': '2025_bu01' }
        });
        const data = await response.json();
        console.log(`   ${route.name.padEnd(15)}: ${data.data?.length || 0} items (DB: ${data.database_type || 'undefined'})`);
      } catch (error) {
        console.log(`   ${route.name.padEnd(15)}: ERROR - ${error.message}`);
      }
    }
    
    // 5. Vérifier les routes spécifiques problématiques
    console.log('\n5️⃣ DIAGNOSTIC ROUTES SPÉCIFIQUES:');
    
    // Test direct de la route fournisseurs
    console.log('   🔍 Test direct /api/suppliers:');
    const directSuppliersResponse = await fetch('http://localhost:3005/api/suppliers', {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const directSuppliersData = await directSuppliersResponse.json();
    console.log(`      Backend direct: ${directSuppliersData.data?.length || 0} fournisseurs`);
    console.log(`      Database type: ${directSuppliersData.database_type}`);
    console.log(`      Source: ${directSuppliersData.source}`);
    
    if (directSuppliersData.data && directSuppliersData.data.length > 0) {
      console.log(`      Premier: ${directSuppliersData.data[0].nfournisseur} - ${directSuppliersData.data[0].nom_fournisseur}`);
    }
    
    // Test via frontend
    console.log('   🔍 Test via frontend /api/suppliers:');
    const frontendSuppliersResponse = await fetch('http://localhost:3000/api/suppliers', {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const frontendSuppliersData = await frontendSuppliersResponse.json();
    console.log(`      Frontend: ${frontendSuppliersData.data?.length || 0} fournisseurs`);
    console.log(`      Database type: ${frontendSuppliersData.database_type}`);
    console.log(`      Source: ${frontendSuppliersData.source}`);
    
    if (frontendSuppliersData.data && frontendSuppliersData.data.length > 0) {
      console.log(`      Premier: ${frontendSuppliersData.data[0].nfournisseur} - ${frontendSuppliersData.data[0].nom_fournisseur}`);
    }
    
    // 6. Comparer les données
    console.log('\n6️⃣ COMPARAISON DES DONNÉES:');
    const backendCount = directSuppliersData.data?.length || 0;
    const frontendCount = frontendSuppliersData.data?.length || 0;
    
    if (backendCount === frontendCount) {
      console.log('   ✅ Même nombre de fournisseurs backend/frontend');
    } else {
      console.log(`   ❌ DIFFÉRENCE: Backend=${backendCount}, Frontend=${frontendCount}`);
    }
    
    const backendDB = directSuppliersData.database_type;
    const frontendDB = frontendSuppliersData.database_type;
    
    if (backendDB === frontendDB) {
      console.log('   ✅ Même type de base de données backend/frontend');
    } else {
      console.log(`   ❌ DIFFÉRENCE DB TYPE: Backend=${backendDB}, Frontend=${frontendDB}`);
    }
    
    // 7. Vérifier les logs backend
    console.log('\n7️⃣ VÉRIFICATION LOGS BACKEND:');
    console.log('   📋 Vérifiez les logs du serveur backend pour voir:');
    console.log('   - Les appels "🔀 DatabaseRouter: get_suppliers_by_tenant → mysql"');
    console.log('   - Les erreurs de connexion MySQL');
    console.log('   - Les appels RPC qui échouent');
    
    // 8. Recommandations
    console.log('\n8️⃣ RECOMMANDATIONS:');
    if (backendCount !== frontendCount || backendDB !== frontendDB) {
      console.log('   🚨 PROBLÈME DÉTECTÉ:');
      console.log('   1. Le frontend ne passe pas par le backend correctement');
      console.log('   2. Ou il y a un cache/proxy qui interfère');
      console.log('   3. Ou les routes frontend ne sont pas mises à jour');
      
      console.log('\n   🔧 SOLUTIONS À TESTER:');
      console.log('   1. Redémarrer le serveur frontend (Ctrl+C puis bun dev)');
      console.log('   2. Vider complètement le cache navigateur');
      console.log('   3. Vérifier que les routes frontend appellent bien le backend');
      console.log('   4. Tester en navigation privée');
    } else {
      console.log('   ✅ Les données semblent cohérentes');
      console.log('   💡 Le problème peut être dans l\'interface utilisateur');
    }
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
}

diagnosticComplet();