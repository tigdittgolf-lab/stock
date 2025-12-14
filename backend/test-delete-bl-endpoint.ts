// Tester l'endpoint de suppression de BL
async function testDeleteBLEndpoint() {
  console.log('🧪 Testing DELETE delivery note endpoint...');
  
  // D'abord, vérifier les BL existants
  try {
    console.log('📋 Checking existing delivery notes...');
    const listResponse = await fetch('http://localhost:3005/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const listResult = await listResponse.json();
    
    if (listResult.success && listResult.data.length > 0) {
      console.log(`✅ Found ${listResult.data.length} delivery notes`);
      listResult.data.forEach((bl, index) => {
        console.log(`   BL ${index + 1}: N° ${bl.nbl}, Client ${bl.nclient}, Montant ${bl.montant_ttc} DA`);
      });
      
      // Tester la suppression du premier BL (mais ne pas l'exécuter vraiment)
      const firstBL = listResult.data[0];
      console.log(`\n🧪 Testing DELETE endpoint for BL ${firstBL.nbl} (simulation)...`);
      
      // Simuler l'appel DELETE (commenté pour ne pas supprimer vraiment)
      /*
      const deleteResponse = await fetch(`http://localhost:3005/api/sales/delivery-notes/${firstBL.nbl}`, {
        method: 'DELETE',
        headers: {
          'X-Tenant': '2025_bu01'
        }
      });
      
      const deleteResult = await deleteResponse.json();
      
      if (deleteResult.success) {
        console.log('✅ DELETE endpoint successful!');
        console.log('📊 Result:', deleteResult);
      } else {
        console.error('❌ DELETE endpoint failed:', deleteResult);
      }
      */
      
      console.log('⚠️  DELETE test skipped to preserve data');
      console.log('🔧 To test deletion, uncomment the code in test-delete-bl-endpoint.ts');
      console.log('📋 The endpoint is ready and should work when the RPC function is created');
      
    } else {
      console.log('📋 No delivery notes found to test deletion');
    }
    
  } catch (error) {
    console.error('❌ Error testing delete endpoint:', error);
  }
}

testDeleteBLEndpoint();