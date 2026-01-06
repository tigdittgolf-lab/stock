// Test pour vérifier la structure des données BL
async function testBLDataStructure() {
  try {
    console.log('🔍 Testing BL data structure...');
    
    // Test de l'API frontend
    const frontendResponse = await fetch('https://frontend-6kb8x9obr-tigdittgolf-9191s-projects.vercel.app/api/sales/delivery-notes', {
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
        console.log('- Full object:', JSON.stringify(firstBL, null, 2));
      }
    } else {
      console.error('❌ Frontend API Error:', frontendResponse.status, await frontendResponse.text());
    }
    
    // Test du backend direct
    console.log('\n🔍 Testing backend direct...');
    const backendResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    if (backendResponse.ok) {
      const backendData = await backendResponse.json();
      console.log('✅ Backend API Response:', JSON.stringify(backendData, null, 2));
      
      if (backendData.success && backendData.data && backendData.data.length > 0) {
        console.log('📊 Backend First BL structure:');
        const firstBL = backendData.data[0];
        console.log('- Keys:', Object.keys(firstBL));
        console.log('- nfact:', firstBL.nfact, typeof firstBL.nfact);
        console.log('- nbl:', firstBL.nbl, typeof firstBL.nbl);
        console.log('- id:', firstBL.id, typeof firstBL.id);
      }
    } else {
      console.error('❌ Backend API Error:', backendResponse.status, await backendResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Test Error:', error);
  }
}

testBLDataStructure();