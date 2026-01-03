// VÉRIFICATION URGENTE : Où sont les données existantes ?
async function urgentCheckExistingData() {
  try {
    console.log('🚨 VÉRIFICATION URGENTE DES DONNÉES EXISTANTES...');
    
    const productionUrl = 'https://frontend-iota-six-72.vercel.app';
    const tenant = '2025_bu01';
    
    console.log(`📊 URL: ${productionUrl}`);
    console.log(`🏢 Tenant: ${tenant}`);
    console.log('=' .repeat(70));
    
    // 1. VÉRIFICATION BL (CRITIQUE)
    console.log('\n📋 1. VÉRIFICATION BL EXISTANTS');
    try {
      const blResponse = await fetch(`${productionUrl}/api/sales/delivery-notes`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status BL:', blResponse.status);
      
      if (blResponse.status === 200) {
        const blData = await blResponse.json();
        console.log('📋 BL trouvés:', blData.data?.length || 0);
        
        if (blData.data && blData.data.length > 0) {
          console.log('✅ VOS BL SONT LÀ:');
          blData.data.forEach((bl, index) => {
            console.log(`   ${index + 1}. BL ${bl.nfact || bl.nbl} - ${bl.client_name} - ${bl.montant_ht} DA (${bl.date_fact})`);
          });
        } else {
          console.log('❌ ALERTE: AUCUN BL TROUVÉ !');
        }
      } else {
        console.log('❌ ERREUR BL:', blResponse.status);
        const errorText = await blResponse.text();
        console.log('Erreur:', errorText.substring(0, 300));
      }
    } catch (error) {
      console.log('❌ ERREUR BL:', error.message);
    }
    
    // 2. VÉRIFICATION FACTURES (CRITIQUE)
    console.log('\n💰 2. VÉRIFICATION FACTURES EXISTANTES');
    try {
      const factResponse = await fetch(`${productionUrl}/api/sales/invoices`, {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status factures:', factResponse.status);
      
      if (factResponse.status === 200) {
        const factData = await factResponse.json();
        console.log('💰 Factures trouvées:', factData.data?.length || 0);
        
        if (factData.data && factData.data.length > 0) {
          console.log('✅ VOS FACTURES SONT LÀ:');
          factData.data.forEach((fact, index) => {
            console.log(`   ${index + 1}. Facture ${fact.nfact} - ${fact.client_name || 'Client'} - ${fact.montant_ht} DA`);
          });
        } else {
          console.log('❌ ALERTE: AUCUNE FACTURE TROUVÉE !');
        }
      } else {
        console.log('❌ ERREUR FACTURES:', factResponse.status);
      }
    } catch (error) {
      console.log('❌ ERREUR FACTURES:', error.message);
    }
    
    // 3. VÉRIFICATION BACKEND DIRECT (pour comparaison)
    console.log('\n🔧 3. VÉRIFICATION BACKEND DIRECT');
    try {
      const backendBLResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
        method: 'GET',
        headers: {
          'X-Tenant': tenant,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📊 Status backend BL:', backendBLResponse.status);
      
      if (backendBLResponse.status === 200) {
        const backendBLData = await backendBLResponse.json();
        console.log('🔧 Backend BL:', backendBLData.data?.length || 0);
        
        if (backendBLData.data && backendBLData.data.length > 0) {
          console.log('✅ BACKEND A VOS DONNÉES:');
          backendBLData.data.forEach((bl, index) => {
            console.log(`   ${index + 1}. BL ${bl.nfact || bl.nbl} - ${bl.client_name} - ${bl.montant_ht} DA`);
          });
        }
      }
    } catch (error) {
      console.log('❌ ERREUR BACKEND:', error.message);
    }
    
    // 4. VÉRIFICATION DASHBOARD
    console.log('\n📊 4. VÉRIFICATION DASHBOARD');
    try {
      const dashboardResponse = await fetch(`${productionUrl}/dashboard`, {
        method: 'GET'
      });
      
      console.log('📊 Status dashboard page:', dashboardResponse.status);
    } catch (error) {
      console.log('❌ ERREUR DASHBOARD PAGE:', error.message);
    }
    
    console.log('\n' + '=' .repeat(70));
    console.log('🎯 DIAGNOSTIC:');
    
    console.log('Si frontend BL = 0 mais backend BL > 0:');
    console.log('  → Route /api/sales/* manquante dans frontend');
    console.log('Si frontend BL = backend BL > 0:');
    console.log('  → Données OK, problème d\'affichage dashboard');
    console.log('Si backend BL = 0:');
    console.log('  → Données perdues ou mauvais tenant');
    
  } catch (error) {
    console.error('❌ Erreur diagnostic:', error);
  }
}

urgentCheckExistingData();