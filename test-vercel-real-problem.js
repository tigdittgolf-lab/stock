// Test pour reproduire le problème exact de l'utilisateur
const VERCEL_URL = 'https://frontend-ctz9rb2z5-tigdittgolf-9191s-projects.vercel.app';
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function testRealVercelProblem() {
  console.log('🔍 REPRODUCTION DU PROBLÈME UTILISATEUR');
  console.log('='.repeat(50));
  console.log(`🌐 Vercel: ${VERCEL_URL}`);
  console.log(`🔗 Tunnel: ${TUNNEL_URL}`);
  
  try {
    // 1. Authentification via tunnel (comme le ferait Vercel)
    console.log('\n1️⃣ AUTHENTIFICATION VIA TUNNEL');
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': VERCEL_URL  // Simuler l'origine Vercel
      },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    console.log('✅ Authentification réussie');
    
    // 2. Switch vers MySQL (comme le ferait l'utilisateur)
    console.log('\n2️⃣ SWITCH VERS MYSQL');
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
    
    // 3. Test toutes les routes que le frontend pourrait utiliser
    console.log('\n3️⃣ TEST TOUTES LES ROUTES FRONTEND');
    
    const routes = [
      '/api/suppliers',
      '/api/sales/suppliers', 
      '/api/articles',
      '/api/sales/articles',
      '/api/clients',
      '/api/sales/clients'
    ];
    
    for (const route of routes) {
      console.log(`\n🔍 Test ${route}:`);
      
      const response = await fetch(`${TUNNEL_URL}${route}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01',
          'Origin': VERCEL_URL
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const items = data.data || data;
        console.log(`   📦 ${items.length} éléments`);
        console.log(`   🔗 Source: ${data.source || 'unknown'}`);
        console.log(`   🗄️ DB Type: ${data.database_type || 'unknown'}`);
        
        if (items.length > 0) {
          const firstItem = items[0];
          const name = firstItem.nom_fournisseur || firstItem.designation || firstItem.nom_client || 'N/A';
          console.log(`   📋 Premier: ${name}`);
          
          // Vérifier si c'est des données Supabase ou MySQL
          if (name === 'FOURNISSEUR 1' || name.includes('FOURNISSEUR')) {
            console.log(`   ⚠️ ATTENTION: Données Supabase détectées !`);
          } else if (name === 'Outillage Pro' || name.includes('Outillage')) {
            console.log(`   ✅ OK: Données MySQL détectées`);
          }
        }
      } else {
        console.log(`   ❌ Erreur: ${response.status}`);
      }
    }
    
    // 4. Test spécifique du dashboard (page principale)
    console.log('\n4️⃣ TEST SIMULATION DASHBOARD');
    
    // Simuler exactement ce que fait le dashboard
    const dashboardResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01',
        'Origin': VERCEL_URL,
        'Referer': `${VERCEL_URL}/dashboard`
      }
    });
    
    if (dashboardResponse.ok) {
      const dashboardData = await dashboardResponse.json();
      const suppliers = dashboardData.data || dashboardData;
      
      console.log(`📊 Dashboard - Fournisseurs: ${suppliers.length}`);
      console.log(`🔗 Source: ${dashboardData.source}`);
      console.log(`🗄️ DB Type: ${dashboardData.database_type}`);
      
      if (suppliers.length > 0) {
        console.log(`📋 Premiers fournisseurs:`);
        suppliers.slice(0, 3).forEach((s, i) => {
          console.log(`   ${i+1}. ${s.nom_fournisseur} (${s.nfournisseur})`);
        });
        
        // Diagnostic final
        const hasSupabaseData = suppliers.some(s => s.nom_fournisseur?.includes('FOURNISSEUR'));
        const hasMySQLData = suppliers.some(s => s.nom_fournisseur?.includes('Outillage'));
        
        console.log('\n🎯 DIAGNOSTIC FINAL:');
        if (hasSupabaseData && !hasMySQLData) {
          console.log('❌ PROBLÈME CONFIRMÉ: Données Supabase alors que MySQL sélectionné');
        } else if (hasMySQLData && !hasSupabaseData) {
          console.log('✅ OK: Données MySQL correctes');
        } else {
          console.log('⚠️ DONNÉES MIXTES: Problème de cohérence');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testRealVercelProblem();