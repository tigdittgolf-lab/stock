// Tester l'accès aux données partagées sur le même tenant
async function testSharedDataAccess() {
  try {
    console.log('🔍 Test d\'accès aux données partagées (même tenant)...');
    
    const productionUrl = 'https://frontend-iota-six-72.vercel.app';
    const sharedTenant = '2025_bu01'; // Le MÊME tenant que vous utilisez
    
    console.log(`📊 Test du tenant partagé: ${sharedTenant}`);
    
    // Test des BL (vos données que votre ami devrait voir)
    console.log('\n📋 Test d\'accès aux BL...');
    const blResponse = await fetch(`${productionUrl}/api/sales/delivery-notes`, {
      method: 'GET',
      headers: {
        'X-Tenant': sharedTenant,
        'Content-Type': 'application/json'
      }
    });
    
    if (blResponse.status === 200) {
      const blData = await blResponse.json();
      console.log('✅ BL accessibles:', blData.data?.length || 0, 'BL trouvés');
      
      if (blData.data && blData.data.length > 0) {
        console.log('📋 Vos BL que votre ami devrait voir:');
        blData.data.forEach((bl, index) => {
          console.log(`  ${index + 1}. BL ${bl.nfact || bl.nbl} - Client: ${bl.client_name} - ${bl.montant_ht} DA`);
        });
      }
    } else {
      console.log('❌ Erreur accès BL:', blResponse.status);
    }
    
    // Test des clients
    console.log('\n👥 Test d\'accès aux clients...');
    const clientsResponse = await fetch(`${productionUrl}/api/clients`, {
      method: 'GET',
      headers: {
        'X-Tenant': sharedTenant,
        'Content-Type': 'application/json'
      }
    });
    
    if (clientsResponse.status === 200) {
      const clientsData = await clientsResponse.json();
      console.log('✅ Clients accessibles:', clientsData.data?.length || 0, 'clients trouvés');
    }
    
    // Test des fournisseurs
    console.log('\n🏭 Test d\'accès aux fournisseurs...');
    const suppliersResponse = await fetch(`${productionUrl}/api/suppliers`, {
      method: 'GET',
      headers: {
        'X-Tenant': sharedTenant,
        'Content-Type': 'application/json'
      }
    });
    
    if (suppliersResponse.status === 200) {
      const suppliersData = await suppliersResponse.json();
      console.log('✅ Fournisseurs accessibles:', suppliersData.data?.length || 0, 'fournisseurs trouvés');
    }
    
    console.log('\n📌 SOLUTION CORRECTE:');
    console.log('🎯 Votre ami doit utiliser le MÊME tenant que vous: 2025_bu01');
    console.log('🎯 Ainsi il verra VOS données (BL, factures, clients, etc.)');
    console.log('🎯 Vous travaillez ensemble sur les mêmes informations centralisées');
    
    console.log('\n📋 Instructions corrigées pour votre ami:');
    console.log('1. Aller sur: https://frontend-iota-six-72.vercel.app/');
    console.log('2. Se connecter (admin/admin)');
    console.log('3. Sélectionner: Business Unit 01 (2025) - 2025_bu01');
    console.log('4. Il verra VOS données partagées !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testSharedDataAccess();