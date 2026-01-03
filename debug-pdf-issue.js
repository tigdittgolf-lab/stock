// Script de diagnostic pour le probleme d'impression PDF
console.log('Diagnostic du probleme d\'impression PDF...\n');

async function testPDFEndpoints() {
  const baseUrl = 'http://localhost:3005';
  const tenant = '2025_bu01';
  
  console.log('1. Test de sante du backend...');
  try {
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Backend sante:', healthData);
  } catch (error) {
    console.error('Backend non accessible:', error.message);
    return;
  }

  console.log('\n2. Test de recuperation des bons de livraison...');
  try {
    const blResponse = await fetch(`${baseUrl}/api/sales/delivery-notes`, {
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });
    
    if (!blResponse.ok) {
      throw new Error(`HTTP ${blResponse.status}: ${blResponse.statusText}`);
    }
    
    const blData = await blResponse.json();
    console.log('✅ Bons de livraison récupérés:', {
      success: blData.success,
      count: blData.data?.length || 0,
      firstBL: blData.data?.[0]?.nbl || 'Aucun'
    });
    
    if (blData.data && blData.data.length > 0) {
      const firstBL = blData.data[0];
      console.log('\n3️⃣ Test de génération PDF pour le premier BL...');
      
      try {
        const pdfResponse = await fetch(`${baseUrl}/api/pdf/delivery-note/${firstBL.nbl}`, {
          headers: {
            'X-Tenant': tenant,
            'Content-Type': 'application/json'
          }
        });
        
        console.log('📄 Réponse PDF:', {
          status: pdfResponse.status,
          statusText: pdfResponse.statusText,
          contentType: pdfResponse.headers.get('content-type')
        });
        
        if (!pdfResponse.ok) {
          const errorData = await pdfResponse.json();
          console.error('❌ Erreur PDF:', errorData);
        } else {
          console.log('✅ PDF généré avec succès !');
        }
        
      } catch (pdfError) {
        console.error('❌ Erreur lors de la génération PDF:', pdfError.message);
      }
    } else {
      console.log('⚠️ Aucun bon de livraison trouvé pour tester le PDF');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des BL:', error.message);
  }

  console.log('\n4️⃣ Test des fonctions RPC...');
  try {
    // Test direct de la fonction RPC
    const rpcResponse = await fetch(`${baseUrl}/api/database/test-rpc`, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        function_name: 'get_bl_with_details',
        params: { p_tenant: tenant, p_nfact: 1 }
      })
    });
    
    if (rpcResponse.ok) {
      const rpcData = await rpcResponse.json();
      console.log('✅ Test RPC:', rpcData);
    } else {
      console.log('⚠️ Endpoint RPC test non disponible');
    }
    
  } catch (error) {
    console.log('⚠️ Test RPC non disponible:', error.message);
  }
}

// Exécuter le diagnostic
testPDFEndpoints().then(() => {
  console.log('\n🏁 Diagnostic terminé !');
}).catch(error => {
  console.error('❌ Erreur lors du diagnostic:', error);
});