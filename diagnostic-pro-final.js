// DIAGNOSTIC PROFESSIONNEL FINAL - IDENTIFIER LA VRAIE CAUSE
const NEW_VERCEL_URL = 'https://frontend-80xymdp0o-tigdittgolf-9191s-projects.vercel.app';
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function diagnosticProFinal() {
  console.log('🔍 DIAGNOSTIC PROFESSIONNEL FINAL');
  console.log('='.repeat(60));
  
  let token = null;
  
  try {
    // 1. Authentification
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    token = authData.token;
    console.log('✅ Authentification OK');
    
    // 2. Vérifier l'état initial du backend
    console.log('\n📊 ÉTAT BACKEND INITIAL');
    const configResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const configData = await configResponse.json();
    console.log(`Base backend actuelle: ${configData.data.type}`);
    
    // 3. FORCER le switch vers MySQL avec vérification immédiate
    console.log('\n🔄 SWITCH FORCÉ VERS MYSQL');
    const switchResponse = await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ database: 'mysql' })
    });
    
    const switchData = await switchResponse.json();
    console.log(`Switch result: ${JSON.stringify(switchData)}`);
    
    // Vérification immédiate
    const verifyResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const verifyData = await verifyResponse.json();
    console.log(`Base après switch: ${verifyData.data.type}`);
    
    // 4. TEST TOUTES LES ROUTES POSSIBLES
    console.log('\n🧪 TEST TOUTES LES ROUTES POSSIBLES');
    
    const routes = [
      '/api/suppliers',
      '/api/sales/suppliers',
      '/api/articles', 
      '/api/sales/articles',
      '/api/clients',
      '/api/sales/clients'
    ];
    
    for (const route of routes) {
      console.log(`\n🔍 ${route}:`);
      
      const response = await fetch(`${TUNNEL_URL}${route}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.data || data;
        
        console.log(`   📦 ${items.length} éléments`);
        console.log(`   🗄️ DB: ${data.database_type}`);
        console.log(`   🔗 Source: ${data.source}`);
        
        if (items.length > 0) {
          const firstItem = items[0];
          const name = firstItem.nom_fournisseur || firstItem.designation || firstItem.nom_client;
          console.log(`   📋 Premier: ${name}`);
          
          // DIAGNOSTIC CRITIQUE
          if (route.includes('suppliers') || route.includes('fournisseurs')) {
            if (name?.includes('FOURNISSEUR')) {
              console.log(`   ❌ PROBLÈME CRITIQUE: Données Supabase sur route ${route} !`);
            } else if (name?.includes('Outillage')) {
              console.log(`   ✅ OK: Données MySQL sur route ${route}`);
            }
          }
        }
      } else {
        console.log(`   ❌ Erreur: ${response.status}`);
      }
    }
    
    // 5. TEST DIRECT DES SERVICES BACKEND
    console.log('\n🔧 TEST DIRECT SERVICES BACKEND');
    
    // Test direct du service de base de données
    const directTestResponse = await fetch(`${TUNNEL_URL}/api/database`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({
        function: 'get_suppliers_by_tenant',
        params: { p_tenant: '2025_bu01' }
      })
    });
    
    if (directTestResponse.ok) {
      const directData = await directTestResponse.json();
      console.log(`Direct RPC: ${directData.success ? '✅' : '❌'}`);
      if (directData.success && directData.data) {
        console.log(`   📦 ${directData.data.length} fournisseurs via RPC direct`);
        if (directData.data.length > 0) {
          console.log(`   📋 Premier via RPC: ${directData.data[0].nom_fournisseur}`);
        }
      }
    }
    
    // 6. VÉRIFIER LES LOGS BACKEND EN TEMPS RÉEL
    console.log('\n📋 VÉRIFICATION LOGS BACKEND');
    console.log('Vérifie les logs du backend pour voir quel service est réellement appelé...');
    
    // 7. TEST AVEC DIFFÉRENTS HEADERS
    console.log('\n🌐 TEST AVEC HEADERS VERCEL');
    
    const vercelTestResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01',
        'Origin': NEW_VERCEL_URL,
        'Referer': `${NEW_VERCEL_URL}/dashboard`,
        'User-Agent': 'Mozilla/5.0 (Vercel Frontend)'
      }
    });
    
    if (vercelTestResponse.ok) {
      const vercelData = await vercelTestResponse.json();
      const suppliers = vercelData.data || vercelData;
      
      console.log(`📦 Avec headers Vercel: ${suppliers.length} fournisseurs`);
      console.log(`🗄️ DB Type: ${vercelData.database_type}`);
      
      if (suppliers.length > 0) {
        console.log(`📋 Premier avec headers Vercel: ${suppliers[0].nom_fournisseur}`);
        
        if (suppliers[0].nom_fournisseur?.includes('FOURNISSEUR')) {
          console.log('❌ PROBLÈME CONFIRMÉ: Même avec headers Vercel, données Supabase !');
        } else {
          console.log('✅ OK: Headers Vercel donnent données MySQL');
        }
      }
    }
    
    // 8. DIAGNOSTIC FINAL
    console.log('\n🎯 DIAGNOSTIC FINAL');
    console.log('='.repeat(40));
    
    // Test final de cohérence
    const finalTestResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (finalTestResponse.ok) {
      const finalData = await finalTestResponse.json();
      const finalSuppliers = finalData.data || finalData;
      
      console.log(`RÉSULTAT FINAL:`);
      console.log(`- Base sélectionnée: MySQL`);
      console.log(`- DB Type retourné: ${finalData.database_type}`);
      console.log(`- Nombre fournisseurs: ${finalSuppliers.length}`);
      console.log(`- Source: ${finalData.source}`);
      
      if (finalSuppliers.length > 0) {
        console.log(`- Premier fournisseur: ${finalSuppliers[0].nom_fournisseur}`);
        
        const isSupabaseData = finalSuppliers[0].nom_fournisseur?.includes('FOURNISSEUR');
        const isMySQLData = finalSuppliers[0].nom_fournisseur?.includes('Outillage');
        
        if (isSupabaseData) {
          console.log('\n❌ PROBLÈME CONFIRMÉ: Le backend retourne des données Supabase');
          console.log('   Causes possibles:');
          console.log('   1. Le switch ne persiste pas');
          console.log('   2. Une route utilise encore databaseRouter');
          console.log('   3. Le service backend a un problème de state');
          console.log('   4. Il y a un cache côté backend');
        } else if (isMySQLData) {
          console.log('\n✅ SUCCÈS: Le backend retourne bien des données MySQL');
          console.log('   Le problème doit être côté frontend/cache');
        } else {
          console.log('\n⚠️ DONNÉES INCONNUES: Ni Supabase ni MySQL');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error.message);
  }
}

diagnosticProFinal();