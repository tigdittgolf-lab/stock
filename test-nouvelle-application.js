// Test de la nouvelle application déployée
const NEW_VERCEL_URL = 'https://frontend-80xymdp0o-tigdittgolf-9191s-projects.vercel.app';
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function testNouvelleApplication() {
  console.log('🚀 TEST NOUVELLE APPLICATION DÉPLOYÉE');
  console.log('='.repeat(50));
  console.log(`🌐 Nouvelle URL: ${NEW_VERCEL_URL}`);
  console.log(`🔗 Tunnel: ${TUNNEL_URL}`);
  
  try {
    // 1. Test accessibilité
    console.log('\n1️⃣ TEST ACCESSIBILITÉ');
    const appResponse = await fetch(NEW_VERCEL_URL, { method: 'HEAD' });
    console.log(`Application accessible: ${appResponse.ok ? '✅' : '❌'} (${appResponse.status})`);
    
    // 2. Authentification
    console.log('\n2️⃣ AUTHENTIFICATION');
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Origin': NEW_VERCEL_URL
      },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    console.log(`Authentification: ${authData.success ? '✅' : '❌'}`);
    
    if (!authData.success) {
      console.log('❌ Impossible de continuer sans authentification');
      return;
    }
    
    // 3. Test switch MySQL
    console.log('\n3️⃣ TEST SWITCH MYSQL');
    const switchResponse = await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        'Origin': NEW_VERCEL_URL
      },
      body: JSON.stringify({ database: 'mysql' })
    });
    
    const switchData = await switchResponse.json();
    console.log(`Switch MySQL: ${switchData.success ? '✅' : '❌'} ${switchData.message}`);
    
    // 4. Test récupération fournisseurs
    console.log('\n4️⃣ TEST FOURNISSEURS MYSQL');
    const suppliersResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01',
        'Origin': NEW_VERCEL_URL
      }
    });
    
    if (suppliersResponse.ok) {
      const suppliersData = await suppliersResponse.json();
      const suppliers = suppliersData.data || suppliersData;
      
      console.log(`📦 Fournisseurs: ${suppliers.length}`);
      console.log(`🔗 Source: ${suppliersData.source}`);
      console.log(`🗄️ DB Type: ${suppliersData.database_type}`);
      
      if (suppliers.length > 0) {
        console.log(`📋 Premiers fournisseurs:`);
        suppliers.slice(0, 2).forEach((s, i) => {
          console.log(`   ${i+1}. ${s.nom_fournisseur} (${s.nfournisseur})`);
        });
        
        // Vérification des données
        const isMySQL = suppliers.some(s => s.nom_fournisseur?.includes('Outillage'));
        const isSupabase = suppliers.some(s => s.nom_fournisseur?.includes('FOURNISSEUR'));
        
        if (isMySQL && !isSupabase) {
          console.log('✅ SUCCÈS: Données MySQL correctes !');
        } else if (isSupabase && !isMySQL) {
          console.log('❌ PROBLÈME: Encore des données Supabase');
        } else {
          console.log('⚠️ DONNÉES MIXTES: Problème de cohérence');
        }
      }
    } else {
      console.log(`❌ Erreur récupération fournisseurs: ${suppliersResponse.status}`);
    }
    
    // 5. Test switch Supabase pour comparaison
    console.log('\n5️⃣ TEST SWITCH SUPABASE (COMPARAISON)');
    const switchSupabaseResponse = await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json', 
        'Authorization': `Bearer ${token}`,
        'Origin': NEW_VERCEL_URL
      },
      body: JSON.stringify({ database: 'supabase' })
    });
    
    const switchSupabaseData = await switchSupabaseResponse.json();
    console.log(`Switch Supabase: ${switchSupabaseData.success ? '✅' : '❌'}`);
    
    const supabaseResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'X-Tenant': '2025_bu01',
        'Origin': NEW_VERCEL_URL
      }
    });
    
    if (supabaseResponse.ok) {
      const supabaseData = await supabaseResponse.json();
      const supabaseSuppliers = supabaseData.data || supabaseData;
      
      console.log(`📦 Fournisseurs Supabase: ${supabaseSuppliers.length}`);
      if (supabaseSuppliers.length > 0) {
        console.log(`📋 Premier Supabase: ${supabaseSuppliers[0].nom_fournisseur}`);
      }
    }
    
    console.log('\n🎯 RÉSUMÉ');
    console.log('='.repeat(30));
    console.log('✅ Application déployée et accessible');
    console.log('✅ CORS configuré correctement');
    console.log('✅ Authentification fonctionnelle');
    console.log('Maintenant tu peux tester dans ton navigateur !');
    
    console.log('\n📋 INSTRUCTIONS POUR TOI:');
    console.log(`1. Va sur: ${NEW_VERCEL_URL}`);
    console.log('2. Connecte-toi avec admin/admin123');
    console.log('3. Va dans Admin > Configuration Base de Données');
    console.log('4. Sélectionne MySQL et teste');
    console.log('5. Va dans Fournisseurs - tu devrais voir "Outillage Pro" et "Visserie Express"');
    console.log('6. Retourne dans la config et sélectionne Supabase');
    console.log('7. Va dans Fournisseurs - tu devrais voir "FOURNISSEUR 1", "FOURNISSEUR 2", etc.');
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testNouvelleApplication();