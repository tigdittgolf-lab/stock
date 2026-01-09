// Tester la fonction get_bl_by_id
async function testGetBLById() {
  console.log('🧪 Testing get_bl_by_id RPC function...');
  
  try {
    const response = await fetch(`https://szgodrjglbpzkrksnroi.supabase.co/rest/v1/rpc/get_bl_by_id`, {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        p_tenant: '2025_bu01',
        p_nfact: 5
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ get_bl_by_id returned:`, {
        dataType: Array.isArray(data) ? 'array' : typeof data,
        data: data
      });
      
      if (data && typeof data === 'object') {
        console.log('📋 BL fields:', Object.keys(data));
        console.log('📋 Has details?', data.details ? `Yes (${data.details.length} items)` : 'No');
      }
    } else {
      console.log(`❌ get_bl_by_id failed: ${response.status}`);
      
      // Essayer aussi via l'API backend
      console.log('\n🔍 Testing via backend API...');
      const backendResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes/5', {
        method: 'GET',
        headers: {
          'X-Tenant': '2025_bu01',
          'Content-Type': 'application/json'
        }
      });
      
      if (backendResponse.ok) {
        const backendData = await backendResponse.json();
        console.log('✅ Backend API response:', {
          success: backendData.success,
          hasData: !!backendData.data,
          source: backendData.source,
          database_type: backendData.database_type
        });
        
        if (backendData.data) {
          console.log('📋 BL data fields:', Object.keys(backendData.data));
          console.log('📋 Has details?', backendData.data.details ? `Yes (${backendData.data.details.length} items)` : 'No');
        }
      } else {
        console.log(`❌ Backend API failed: ${backendResponse.status}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testGetBLById();