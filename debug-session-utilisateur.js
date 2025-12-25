// DEBUG SESSION UTILISATEUR - Simuler exactement ce que fait le navigateur
const VERCEL_URL = 'https://frontend-8e5ekyvfr-tigdittgolf-9191s-projects.vercel.app';
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function debugSessionUtilisateur() {
  console.log('🔍 DEBUG SESSION UTILISATEUR COMPLÈTE');
  console.log('='.repeat(60));
  console.log(`🌐 Vercel: ${VERCEL_URL}`);
  console.log(`🔗 Tunnel: ${TUNNEL_URL}`);
  
  let token = null;
  
  try {
    // 1. AUTHENTIFICATION (comme le fait le navigateur)
    console.log('\n1️⃣ AUTHENTIFICATION VIA VERCEL');
    
    // Simuler l'authentification depuis Vercel
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': VERCEL_URL,
        'Referer': `${VERCEL_URL}/login`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    token = authData.token;
    console.log(`Auth: ${authData.success ? '✅' : '❌'}`);
    
    if (!authData.success) {
      console.log('❌ Impossible de continuer');
      return;
    }
    
    // 2. VÉRIFIER L'ÉTAT INITIAL
    console.log('\n2️⃣ ÉTAT INITIAL BACKEND');
    
    const initialState = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL
      }
    });
    const initialData = await initialState.json();
    console.log(`Base initiale: ${initialData.data?.type || 'unknown'}`);
    
    // 3. SWITCH VERS MYSQL (comme le fait l'interface)
    console.log('\n3️⃣ SWITCH VERS MYSQL VIA INTERFACE');
    
    // Simuler exactement ce que fait la page de config
    const switchPayload = {
      type: 'mysql',
      name: 'MySQL Local',
      host: 'localhost',
      port: 3307,
      database: 'stock_management',
      username: 'root',
      password: ''
    };
    
    console.log('Payload switch:', JSON.stringify(switchPayload, null, 2));
    
    const switchResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL,
        'Referer': `${VERCEL_URL}/admin/database-config`
      },
      body: JSON.stringify(switchPayload)
    });
    
    const switchData = await switchResponse.json();
    console.log(`Switch result: ${JSON.stringify(switchData)}`);
    
    // 4. VÉRIFICATION IMMÉDIATE APRÈS SWITCH
    console.log('\n4️⃣ VÉRIFICATION IMMÉDIATE POST-SWITCH');
    
    const verifyResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Origin': VERCEL_URL
      }
    });
    const verifyData = await verifyResponse.json();
    console.log(`Base après switch: ${verifyData.data?.type || 'unknown'}`);
    
    // 5. TEST FOURNISSEURS IMMÉDIATEMENT APRÈS SWITCH
    console.log('\n5️⃣ TEST FOURNISSEURS POST-SWITCH');
    
    // Attendre un peu pour laisser le backend se stabiliser
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const suppliersResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01',
        'Origin': VERCEL_URL,
        'Referer': `${VERCEL_URL}/dashboard`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (suppliersResponse.ok) {
      const suppliersData = await suppliersResponse.json();
      const suppliers = suppliersData.data || suppliersData;
      
      console.log(`📦 Fournisseurs: ${suppliers.length}`);
      console.log(`🔗 Source: ${suppliersData.source}`);
      console.log(`🗄️ DB Type: ${suppliersData.database_type}`);
      console.log(`🏢 Tenant: ${suppliersData.tenant}`);
      
      if (suppliers.length > 0) {
        console.log(`📋 Liste complète des fournisseurs:`);
        suppliers.forEach((s, i) => {
          console.log(`   ${i+1}. ${s.nom_fournisseur} (${s.nfournisseur})`);
        });
        
        // DIAGNOSTIC CRITIQUE
        const hasSupabaseData = suppliers.some(s => s.nom_fournisseur?.includes('FOURNISSEUR'));
        const hasMySQLData = suppliers.some(s => s.nom_fournisseur?.includes('Outillage'));
        
        console.log('\n🎯 ANALYSE DES DONNÉES:');
        if (hasSupabaseData && !hasMySQLData) {
          console.log('❌ PROBLÈME CONFIRMÉ: Données Supabase alors que MySQL sélectionné');
          console.log('   Le backend ne respecte pas le switch ou il y a un cache');
        } else if (hasMySQLData && !hasSupabaseData) {
          console.log('✅ OK: Données MySQL correctes');
        } else if (hasSupabaseData && hasMySQLData) {
          console.log('⚠️ DONNÉES MIXTES: Problème de cohérence');
        } else {
          console.log('❓ DONNÉES INCONNUES');
        }
      }
    } else {
      console.log(`❌ Erreur récupération fournisseurs: ${suppliersResponse.status}`);
      const errorText = await suppliersResponse.text();
      console.log(`Erreur: ${errorText.substring(0, 200)}`);
    }
    
    // 6. TEST AVEC DIFFÉRENTES ROUTES
    console.log('\n6️⃣ TEST TOUTES LES ROUTES FOURNISSEURS');
    
    const routes = [
      '/api/suppliers',
      '/api/sales/suppliers'
    ];
    
    for (const route of routes) {
      console.log(`\n🔍 Route ${route}:`);
      
      const response = await fetch(`${TUNNEL_URL}${route}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01',
          'Origin': VERCEL_URL,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.data || data;
        
        console.log(`   📦 ${items.length} fournisseurs`);
        console.log(`   🗄️ DB: ${data.database_type}`);
        
        if (items.length > 0) {
          const firstName = items[0].nom_fournisseur;
          console.log(`   📋 Premier: ${firstName}`);
          
          if (firstName?.includes('FOURNISSEUR')) {
            console.log(`   ❌ Route ${route}: Données Supabase !`);
          } else if (firstName?.includes('Outillage')) {
            console.log(`   ✅ Route ${route}: Données MySQL`);
          }
        }
      } else {
        console.log(`   ❌ Erreur: ${response.status}`);
      }
    }
    
    // 7. TEST DIRECT DU SERVICE BACKEND
    console.log('\n7️⃣ TEST DIRECT SERVICE BACKEND');
    
    const directResponse = await fetch(`${TUNNEL_URL}/api/database`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01',
        'Origin': VERCEL_URL
      },
      body: JSON.stringify({
        function: 'get_suppliers_by_tenant',
        params: { p_tenant: '2025_bu01' }
      })
    });
    
    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log(`Direct RPC: ${directData.success ? '✅' : '❌'}`);
      
      if (directData.success && directData.data) {
        console.log(`   📦 ${directData.data.length} fournisseurs via RPC direct`);
        if (directData.data.length > 0) {
          console.log(`   📋 Premier via RPC direct: ${directData.data[0].nom_fournisseur}`);
        }
      } else {
        console.log(`   ❌ Erreur RPC: ${directData.error}`);
      }
    } else {
      console.log(`   ❌ Erreur direct: ${directResponse.status}`);
    }
    
    // 8. CONCLUSION
    console.log('\n🎯 CONCLUSION FINALE');
    console.log('='.repeat(40));
    
    console.log('Si toutes les routes montrent des données Supabase alors que MySQL est sélectionné,');
    console.log('alors il y a un problème fondamental dans le backend ou la persistance du switch.');
    console.log('');
    console.log('Actions à prendre:');
    console.log('1. Vérifier les logs backend en temps réel');
    console.log('2. Vérifier si le switch persiste entre les requêtes');
    console.log('3. Identifier si une route utilise encore databaseRouter');
    
  } catch (error) {
    console.error('❌ Erreur debug:', error.message);
  }
}

debugSessionUtilisateur();