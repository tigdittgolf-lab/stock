// Tester le nouveau déploiement
async function testNewDeployment() {
  try {
    console.log('🔍 Test du nouveau déploiement...');
    
    // Nouvelle URL de production
    const newUrl = 'https://frontend-5ksiwwcfr-tigdittgolf-9191s-projects.vercel.app';
    
    console.log(`📡 Test de la nouvelle URL: ${newUrl}`);
    
    // Test de l'API exercises
    const response = await fetch(`${newUrl}/api/auth/exercises`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    
    if (response.status === 200) {
      const data = await response.json();
      console.log('✅ API accessible !');
      
      // Vérifier BU02
      const hasBU02 = data.data && data.data.some(item => item.schema_name === '2025_bu02');
      
      if (hasBU02) {
        console.log('🎉 BU02 disponible dans le nouveau déploiement !');
        console.log('📋 Tenants disponibles:');
        data.data.forEach(tenant => {
          console.log(`  - ${tenant.schema_name} (${tenant.bu_code}) - ${tenant.year}`);
        });
      } else {
        console.log('⚠️ BU02 non trouvé');
      }
      
      // Test de l'interface de sélection des tenants
      console.log('\n🔍 Test de la page de sélection des tenants...');
      const tenantPageResponse = await fetch(`${newUrl}/tenant-selection`);
      console.log('📄 Page tenant-selection:', tenantPageResponse.status);
      
    } else {
      console.log('❌ Erreur API:', response.status);
      const text = await response.text();
      console.log('Réponse:', text.substring(0, 200));
    }
    
    console.log('\n📌 Nouvelle URL de production:');
    console.log(`🌐 ${newUrl}`);
    console.log('\n📋 Instructions pour votre ami:');
    console.log('1. Aller sur cette nouvelle URL');
    console.log('2. Se connecter (admin/admin)');
    console.log('3. Sélectionner: Business Unit 02 (2025) - 2025_bu02');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

testNewDeployment();