// Diagnostic spécifique pour identifier le problème exact de l'utilisateur
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function diagnosticProblemeUtilisateur() {
  console.log('🔍 DIAGNOSTIC PROBLÈME UTILISATEUR');
  console.log('='.repeat(60));
  
  let token = null;
  
  try {
    // 1. Authentification
    console.log('1️⃣ AUTHENTIFICATION');
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    token = authData.token;
    console.log('✅ Authentification OK');
    
    // 2. Vérifier l'état initial
    console.log('\n2️⃣ ÉTAT INITIAL');
    const initialResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const initialData = await initialResponse.json();
    console.log(`Base actuelle: ${initialData.data.type}`);
    
    // 3. Switch vers MySQL et vérifier immédiatement
    console.log('\n3️⃣ SWITCH VERS MYSQL + VÉRIFICATION IMMÉDIATE');
    
    // Switch
    const switchResponse = await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify({ database: 'mysql' })
    });
    const switchData = await switchResponse.json();
    console.log(`Switch: ${switchData.success ? '✅' : '❌'} ${switchData.message}`);
    
    // Vérification immédiate de l'état
    const checkResponse = await fetch(`${TUNNEL_URL}/api/database-config`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkData = await checkResponse.json();
    console.log(`Base après switch: ${checkData.data.type}`);
    
    // 4. Test des fournisseurs avec différentes approches
    console.log('\n4️⃣ TEST FOURNISSEURS - DIFFÉRENTES APPROCHES');
    
    const approaches = [
      { name: 'Route principale', url: '/api/suppliers' },
      { name: 'Route sales', url: '/api/sales/suppliers' },
      { name: 'Route avec cache-bust', url: '/api/sales/suppliers?t=' + Date.now() }
    ];
    
    for (const approach of approaches) {
      console.log(`\n🔍 ${approach.name}:`);
      
      const response = await fetch(`${TUNNEL_URL}${approach.url}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const suppliers = data.data || data;
        
        console.log(`   📦 ${suppliers.length} fournisseurs`);
        console.log(`   🔗 Source: ${data.source}`);
        console.log(`   🗄️ DB Type: ${data.database_type}`);
        
        if (suppliers.length > 0) {
          console.log(`   📋 Premiers fournisseurs:`);
          suppliers.slice(0, 2).forEach((s, i) => {
            console.log(`      ${i+1}. ${s.nom_fournisseur} (${s.nfournisseur})`);
          });
          
          // Identifier le type de données
          const isSupabase = suppliers.some(s => s.nom_fournisseur?.includes('FOURNISSEUR'));
          const isMySQL = suppliers.some(s => s.nom_fournisseur?.includes('Outillage'));
          
          if (isSupabase) {
            console.log(`   ❌ PROBLÈME: Données Supabase détectées !`);
          } else if (isMySQL) {
            console.log(`   ✅ OK: Données MySQL correctes`);
          } else {
            console.log(`   ⚠️ Données inconnues`);
          }
        }
      } else {
        console.log(`   ❌ Erreur HTTP: ${response.status}`);
      }
    }
    
    // 5. Test avec différents tenants
    console.log('\n5️⃣ TEST DIFFÉRENTS TENANTS');
    
    const tenants = ['2025_bu01', '2025_bu02', 'default'];
    
    for (const tenant of tenants) {
      console.log(`\n🏢 Tenant: ${tenant}`);
      
      const response = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': tenant
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        const suppliers = data.data || data;
        console.log(`   📦 ${suppliers.length} fournisseurs`);
        console.log(`   🗄️ DB: ${data.database_type}`);
        
        if (suppliers.length > 0) {
          const firstSupplier = suppliers[0].nom_fournisseur;
          console.log(`   📋 Premier: ${firstSupplier}`);
          
          if (firstSupplier?.includes('FOURNISSEUR')) {
            console.log(`   ❌ Données Supabase !`);
          } else if (firstSupplier?.includes('Outillage')) {
            console.log(`   ✅ Données MySQL`);
          }
        }
      } else {
        console.log(`   ❌ Erreur: ${response.status}`);
      }
    }
    
    // 6. Test de persistance - switch multiple
    console.log('\n6️⃣ TEST PERSISTANCE - SWITCHES MULTIPLES');
    
    const databases = ['supabase', 'mysql', 'postgresql', 'mysql'];
    
    for (const db of databases) {
      console.log(`\n🔄 Switch vers ${db}:`);
      
      const switchResp = await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ database: db })
      });
      
      const switchResult = await switchResp.json();
      console.log(`   Switch: ${switchResult.success ? '✅' : '❌'}`);
      
      // Test immédiat
      const testResp = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'X-Tenant': '2025_bu01'
        }
      });
      
      if (testResp.ok) {
        const testData = await testResp.json();
        const suppliers = testData.data || testData;
        console.log(`   📦 ${suppliers.length} fournisseurs (${testData.database_type})`);
        
        if (suppliers.length > 0) {
          const firstName = suppliers[0].nom_fournisseur;
          console.log(`   📋 Premier: ${firstName}`);
          
          // Vérification cohérence
          const expectedMySQL = db === 'mysql' && firstName?.includes('Outillage');
          const expectedSupabase = db === 'supabase' && firstName?.includes('FOURNISSEUR');
          const expectedPostgreSQL = db === 'postgresql' && firstName?.includes('FOURNISSEUR');
          
          if (expectedMySQL || expectedSupabase || expectedPostgreSQL) {
            console.log(`   ✅ Cohérent avec ${db}`);
          } else {
            console.log(`   ❌ INCOHÉRENT: ${db} sélectionné mais données de ${firstName?.includes('FOURNISSEUR') ? 'Supabase/PostgreSQL' : 'MySQL'}`);
          }
        }
      }
      
      // Petite pause
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n🎯 RÉSUMÉ DIAGNOSTIC');
    console.log('='.repeat(40));
    console.log('Si tu vois "INCOHÉRENT" ou "Données Supabase" quand MySQL est sélectionné,');
    console.log('alors le problème est confirmé et je vais le corriger.');
    console.log('Sinon, le problème pourrait être un cache frontend.');
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error.message);
  }
}

diagnosticProblemeUtilisateur();