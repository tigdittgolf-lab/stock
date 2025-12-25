// Test de la session réelle utilisateur - Identifier le problème exact
const VERCEL_URL = 'https://frontend-8e5ekyvfr-tigdittgolf-9191s-projects.vercel.app';
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function testSessionReelle() {
  console.log('🔍 TEST SESSION RÉELLE UTILISATEUR');
  console.log('='.repeat(60));
  
  let token = null;
  
  try {
    // 1. Authentification comme l'utilisateur
    console.log('1️⃣ AUTHENTIFICATION');
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': VERCEL_URL
      },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    token = authData.token;
    console.log(`Auth: ${authData.success ? '✅' : '❌'}`);
    
    if (!authData.success) {
      console.log('❌ Authentification échouée');
      return;
    }
    
    // 2. Vérifier l'état actuel
    console.log('\n2️⃣ ÉTAT ACTUEL BACKEND');
    const stateResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL
      }
    });
    const stateData = await stateResponse.json();
    console.log(`Base actuelle: ${stateData.data?.type || 'unknown'}`);
    
    // 3. FORCER le switch vers MySQL avec la configuration exacte
    console.log('\n3️⃣ SWITCH FORCÉ VERS MYSQL');
    
    // D'abord, switch vers Supabase pour reset
    await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL
      },
      body: JSON.stringify({ database: 'supabase' })
    });
    
    console.log('Reset vers Supabase...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Maintenant switch vers MySQL
    const switchResponse = await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL
      },
      body: JSON.stringify({ database: 'mysql' })
    });
    
    const switchData = await switchResponse.json();
    console.log(`Switch MySQL: ${switchData.success ? '✅' : '❌'} ${switchData.message}`);
    
    // Attendre que le switch soit effectif
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Vérifier immédiatement après switch
    console.log('\n4️⃣ VÉRIFICATION POST-SWITCH');
    const verifyResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL
      }
    });
    const verifyData = await verifyResponse.json();
    console.log(`Base après switch: ${verifyData.data?.type || 'unknown'}`);
    
    // 5. Test fournisseurs avec TOUS les headers possibles
    console.log('\n5️⃣ TEST FOURNISSEURS AVEC TOUS LES HEADERS');
    
    const testConfigs = [
      {
        name: 'Headers minimaux',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01'
        }
      },
      {
        name: 'Headers Vercel complets',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01',
          'Origin': VERCEL_URL,
          'Referer': `${VERCEL_URL}/dashboard`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      },
      {
        name: 'Headers anti-cache',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01',
          'Origin': VERCEL_URL,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    ];
    
    for (const config of testConfigs) {
      console.log(`\n🔍 ${config.name}:`);
      
      const response = await fetch(`${TUNNEL_URL}/api/sales/suppliers?t=${Date.now()}`, {
        headers: config.headers
      });
      
      if (response.ok) {
        const data = await response.json();
        const suppliers = data.data || data;
        
        console.log(`   📦 ${suppliers.length} fournisseurs`);
        console.log(`   🗄️ DB: ${data.database_type}`);
        console.log(`   🔗 Source: ${data.source}`);
        
        if (suppliers.length > 0) {
          const firstName = suppliers[0].nom_fournisseur;
          console.log(`   📋 Premier: ${firstName}`);
          
          if (firstName?.includes('FOURNISSEUR')) {
            console.log(`   ❌ PROBLÈME: Données Supabase avec ${config.name}`);
          } else if (firstName?.includes('Outillage')) {
            console.log(`   ✅ OK: Données MySQL avec ${config.name}`);
          }
        }
      } else {
        console.log(`   ❌ Erreur: ${response.status}`);
      }
    }
    
    // 6. Test avec différents tenants
    console.log('\n6️⃣ TEST DIFFÉRENTS TENANTS');
    
    const tenants = ['2025_bu01', '2025_bu02', 'default'];
    
    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant}`);
      
      const response = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': tenant,
          'Origin': VERCEL_URL
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const suppliers = data.data || data;
        
        console.log(`   📦 ${suppliers.length} fournisseurs`);
        console.log(`   🗄️ DB: ${data.database_type}`);
        
        if (suppliers.length > 0) {
          console.log(`   📋 Premier: ${suppliers[0].nom_fournisseur}`);
        }
      } else {
        console.log(`   ❌ Erreur: ${response.status}`);
      }
    }
    
    // 7. Test de persistance - Multiples requêtes
    console.log('\n7️⃣ TEST PERSISTANCE - MULTIPLES REQUÊTES');
    
    for (let i = 1; i <= 5; i++) {
      console.log(`\n🔄 Requête ${i}/5:`);
      
      const response = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01',
          'Origin': VERCEL_URL
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const suppliers = data.data || data;
        
        console.log(`   📦 ${suppliers.length} fournisseurs (${data.database_type})`);
        
        if (suppliers.length > 0) {
          const firstName = suppliers[0].nom_fournisseur;
          console.log(`   📋 Premier: ${firstName}`);
          
          if (firstName?.includes('FOURNISSEUR')) {
            console.log(`   ❌ Requête ${i}: Données Supabase !`);
          } else if (firstName?.includes('Outillage')) {
            console.log(`   ✅ Requête ${i}: Données MySQL`);
          }
        }
      }
      
      // Petite pause entre les requêtes
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 8. DIAGNOSTIC FINAL
    console.log('\n🎯 DIAGNOSTIC FINAL');
    console.log('='.repeat(40));
    
    // Test final avec switch explicite
    console.log('Test final avec switch explicite...');
    
    await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL
      },
      body: JSON.stringify({ database: 'mysql' })
    });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const finalResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01',
        'Origin': VERCEL_URL
      }
    });
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      const finalSuppliers = finalData.data || finalData;
      
      console.log('\n📊 RÉSULTAT FINAL:');
      console.log(`- Fournisseurs: ${finalSuppliers.length}`);
      console.log(`- DB Type: ${finalData.database_type}`);
      console.log(`- Source: ${finalData.source}`);
      
      if (finalSuppliers.length > 0) {
        console.log(`- Premier: ${finalSuppliers[0].nom_fournisseur}`);
        
        const isSupabase = finalSuppliers[0].nom_fournisseur?.includes('FOURNISSEUR');
        const isMySQL = finalSuppliers[0].nom_fournisseur?.includes('Outillage');
        
        if (isSupabase) {
          console.log('\n❌ PROBLÈME CONFIRMÉ: Backend retourne Supabase malgré switch MySQL');
          console.log('   Causes possibles:');
          console.log('   1. Le switch ne persiste pas entre les requêtes');
          console.log('   2. Il y a un problème de session/token');
          console.log('   3. Une route utilise encore databaseRouter');
          console.log('   4. Problème de concurrence dans backendDatabaseService');
        } else if (isMySQL) {
          console.log('\n✅ BACKEND OK: Retourne bien MySQL');
          console.log('   Le problème est donc côté frontend/cache');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test session:', error.message);
  }
}

testSessionReelle();