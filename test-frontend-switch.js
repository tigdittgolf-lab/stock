// Test pour vérifier le switch frontend vers MySQL
async function testFrontendSwitch() {
  try {
    console.log('🧪 Test switch frontend vers MySQL...');
    
    // 1. Simuler le switch via l'API frontend (comme le fait l'interface admin)
    const frontendSwitchResponse = await fetch('http://localhost:3000/api/database/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'mysql',
        config: {
          type: 'mysql',
          name: 'MySQL Local',
          host: 'localhost',
          port: 3306,
          database: '2025_bu01',
          username: 'root',
          password: '',
          isActive: true
        }
      })
    });
    
    const frontendSwitchData = await frontendSwitchResponse.json();
    console.log('🔄 Frontend switch result:', frontendSwitchData);
    
    // 2. Vérifier que le backend a bien reçu le changement
    const backendCurrentResponse = await fetch('http://localhost:3005/api/database/current');
    const backendCurrentData = await backendCurrentResponse.json();
    console.log('📊 Backend current type:', backendCurrentData.currentType);
    
    // 3. Tester les fournisseurs via le backend
    const suppliersResponse = await fetch('http://localhost:3005/api/suppliers', {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const suppliersData = await suppliersResponse.json();
    console.log('🏭 Fournisseurs backend:', suppliersData.data?.length, 'trouvés');
    console.log('🏭 Database type:', suppliersData.database_type);
    
    if (suppliersData.data && suppliersData.data.length > 0) {
      console.log('🏭 Premier fournisseur:', suppliersData.data[0].nfournisseur, '-', suppliersData.data[0].nom_fournisseur);
    }
    
    // 4. Instructions pour l'utilisateur
    console.log('');
    console.log('📋 INSTRUCTIONS POUR L\'UTILISATEUR:');
    console.log('1. Va sur http://localhost:3000/admin/database-config');
    console.log('2. Sélectionne "🐬 MySQL (Local)"');
    console.log('3. Configure: host=localhost, port=3306, database=2025_bu01, user=root, password=vide');
    console.log('4. Clique "🧪 Tester la connexion"');
    console.log('5. Clique "🔄 Changer de base"');
    console.log('6. Rafraîchis la page des fournisseurs');
    console.log('');
    console.log('✅ Tu devrais voir 2 fournisseurs MySQL au lieu de 3 fournisseurs Supabase');
    
  } catch (error) {
    console.error('❌ Erreur test frontend switch:', error);
  }
}

testFrontendSwitch();