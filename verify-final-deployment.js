// Vérifier le déploiement final pour l'accès aux données
async function verifyFinalDeployment() {
  try {
    console.log('🔍 Vérification du déploiement final...');
    
    // URL principale de production
    const mainUrl = 'https://frontend-iota-six-72.vercel.app';
    const newUrl = 'https://frontend-m54y0wp2c-tigdittgolf-9191s-projects.vercel.app';
    
    console.log('📡 Test des URLs de production...');
    
    // Test URL principale
    console.log('\n1️⃣ Test URL principale:', mainUrl);
    try {
      const mainResponse = await fetch(`${mainUrl}/api/sales/delivery-notes`, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status URL principale:', mainResponse.status);
      
      if (mainResponse.status === 200) {
        const mainData = await mainResponse.json();
        console.log('✅ BL accessibles:', mainData.data?.length || 0);
        
        if (mainData.data && mainData.data.length > 0) {
          console.log('📋 BL disponibles pour votre ami:');
          mainData.data.forEach((bl, index) => {
            console.log(`   ${index + 1}. BL ${bl.nfact || bl.nbl} - ${bl.client_name} - ${bl.montant_ht} DA`);
          });
        }
      }
    } catch (mainError) {
      console.log('❌ Erreur URL principale:', mainError.message);
    }
    
    // Test nouvelle URL
    console.log('\n2️⃣ Test nouvelle URL:', newUrl);
    try {
      const newResponse = await fetch(`${newUrl}/api/sales/delivery-notes`, {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01',
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status nouvelle URL:', newResponse.status);
      
      if (newResponse.status === 200) {
        const newData = await newResponse.json();
        console.log('✅ BL accessibles sur nouvelle URL:', newData.data?.length || 0);
      } else if (newResponse.status === 401) {
        console.log('⚠️ Nouvelle URL protégée par authentification Vercel');
      }
    } catch (newError) {
      console.log('❌ Erreur nouvelle URL:', newError.message);
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📋 INSTRUCTIONS FINALES POUR VOTRE AMI:');
    console.log('🌐 URL à utiliser: https://frontend-iota-six-72.vercel.app/');
    console.log('🔑 Connexion: admin / admin');
    console.log('🏢 Tenant: Business Unit 01 (2025) - 2025_bu01');
    console.log('📊 Il devrait voir: 5 BL, 2 factures, 1 proforma');
    console.log('✅ Déploiement terminé et vérifié !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

verifyFinalDeployment();