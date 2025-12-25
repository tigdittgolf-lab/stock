// Test pour vérifier que le switch de base de données fonctionne correctement
const TUNNEL_URL = 'https://his-affects-major-injured.trycloudflare.com';

async function testDatabaseSwitchFix() {
  console.log('🔧 TEST CORRECTION SWITCH BASE DE DONNÉES');
  console.log('='.repeat(50));
  
  try {
    // Authentification
    const authResponse = await fetch(`${TUNNEL_URL}/api/auth-real/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' })
    });
    
    const authData = await authResponse.json();
    const token = authData.token;
    console.log('✅ Authentification réussie');
    
    // Test des 3 bases de données
    const databases = ['supabase', 'mysql', 'postgresql'];
    
    for (const db of databases) {
      console.log(`\n🔄 TEST ${db.toUpperCase()}`);
      console.log('-'.repeat(30));
      
      // Switch vers la base
      const switchResponse = await fetch(`${TUNNEL_URL}/api/database-config/switch`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ database: db })
      });
      
      const switchData = await switchResponse.json();
      console.log(`   Switch: ${switchData.success ? '✅' : '❌'} ${switchData.message || switchData.error}`);
      
      if (switchData.success) {
        // Test via /api/suppliers (route principale)
        const suppliersResponse = await fetch(`${TUNNEL_URL}/api/suppliers`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant': '2025_bu01'
          }
        });
        
        if (suppliersResponse.ok) {
          const suppliersData = await suppliersResponse.json();
          const suppliers = suppliersData.data || suppliersData;
          console.log(`   📦 /api/suppliers: ${suppliers.length} fournisseurs`);
          console.log(`   🔗 Source: ${suppliersData.source || 'unknown'}`);
          console.log(`   🗄️ DB Type: ${suppliersData.database_type || 'unknown'}`);
          
          if (suppliers.length > 0) {
            console.log(`   📋 Premier: ${suppliers[0].nom_fournisseur}`);
          }
        }
        
        // Test via /api/sales/suppliers (route utilisée par le frontend)
        const salesSuppliersResponse = await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'X-Tenant': '2025_bu01'
          }
        });
        
        if (salesSuppliersResponse.ok) {
          const salesSuppliersData = await salesSuppliersResponse.json();
          const salesSuppliers = salesSuppliersData.data || salesSuppliersData;
          console.log(`   📦 /api/sales/suppliers: ${salesSuppliers.length} fournisseurs`);
          console.log(`   🔗 Source: ${salesSuppliersData.source || 'unknown'}`);
          console.log(`   🗄️ DB Type: ${salesSuppliersData.database_type || 'unknown'}`);
          
          if (salesSuppliers.length > 0) {
            console.log(`   📋 Premier: ${salesSuppliers[0].nom_fournisseur}`);
          }
        }
        
        // Vérifier que les deux routes donnent les mêmes résultats
        if (suppliersResponse.ok && salesSuppliersResponse.ok) {
          const suppliersData = await (await fetch(`${TUNNEL_URL}/api/suppliers`, {
            headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant': '2025_bu01' }
          })).json();
          
          const salesSuppliersData = await (await fetch(`${TUNNEL_URL}/api/sales/suppliers`, {
            headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant': '2025_bu01' }
          })).json();
          
          const suppliers1 = suppliersData.data || suppliersData;
          const suppliers2 = salesSuppliersData.data || salesSuppliersData;
          
          if (suppliers1.length === suppliers2.length) {
            console.log(`   ✅ Cohérence: Les deux routes retournent ${suppliers1.length} fournisseurs`);
          } else {
            console.log(`   ⚠️ Incohérence: /api/suppliers=${suppliers1.length}, /api/sales/suppliers=${suppliers2.length}`);
          }
        }
      }
    }
    
    console.log('\n🎯 RÉSUMÉ');
    console.log('-'.repeat(30));
    console.log('✅ Test terminé - Vérifiez que chaque base retourne des données différentes');
    console.log('✅ Les routes /api/suppliers et /api/sales/suppliers doivent être cohérentes');
    console.log('✅ Le database_type doit correspondre à la base sélectionnée');
    
  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

testDatabaseSwitchFix();