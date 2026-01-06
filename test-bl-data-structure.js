// Test pour vérifier la structure des données BL
async function testBLDataStructure() {
  try {
    console.log('🔍 Testing BL data structure...');
    
    // Test de l'API frontend CORRIGÉE
    const frontendResponse = await fetch('https://frontend-pzdyr2e1m-tigdittgolf-9191s-projects.vercel.app/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (frontendResponse.ok) {
      const frontendData = await frontendResponse.json();
      console.log('✅ Frontend API Response:', JSON.stringify(frontendData, null, 2));
      
      if (frontendData.success && frontendData.data && frontendData.data.length > 0) {
        console.log('📊 First BL structure:');
        const firstBL = frontendData.data[0];
        console.log('- Keys:', Object.keys(firstBL));
        console.log('- nfact:', firstBL.nfact, typeof firstBL.nfact);
        console.log('- nbl:', firstBL.nbl, typeof firstBL.nbl);
        console.log('- id:', firstBL.id, typeof firstBL.id);
        
        // Test de la logique de validId
        let validId = firstBL.nbl || firstBL.id || firstBL.nfact;
        console.log('✅ CORRECTED validId logic result:', validId, typeof validId);
        
        console.log('- Full object:', JSON.stringify(firstBL, null, 2));
      }
    } else {
      console.error('❌ Frontend API Error:', frontendResponse.status, await frontendResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

testBLDataStructure();