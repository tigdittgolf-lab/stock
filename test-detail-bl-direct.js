// Tester l'accès direct aux détails BL
async function testDetailBLDirect() {
  console.log('🧪 Testing direct access to detail_bl...');
  
  // Test 1: Via fonction RPC get_delivery_notes (qui fonctionne)
  try {
    console.log('\n1️⃣ Testing get_delivery_notes (known working)...');
    const response = await fetch(`https://szgodrjglbpzkrksnroi.supabase.co/rest/v1/rpc/get_delivery_notes`, {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_tenant: '2025_bu01' })
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ get_delivery_notes returned:', {
        count: data.length,
        sample: data[0]
      });
      
      // Chercher le BL 5
      const bl5 = data.find(bl => bl.nbl === 5);
      if (bl5) {
        console.log('📋 BL 5 from get_delivery_notes:', bl5);
        console.log('📋 Fields:', Object.keys(bl5));
      }
    }
  } catch (error) {
    console.error('❌ Error with get_delivery_notes:', error);
  }
  
  // Test 2: Essayer d'accéder directement à la table detail_bl
  try {
    console.log('\n2️⃣ Testing direct table access to detail_bl...');
    const detailResponse = await fetch(`https://szgodrjglbpzkrksnroi.supabase.co/rest/v1/detail_bl?nbl=eq.5`, {
      method: 'GET',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
        'Content-Type': 'application/json'
      }
    });
    
    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      console.log('✅ detail_bl table access successful:', {
        count: detailData.length,
        data: detailData
      });
    } else {
      console.log(`❌ detail_bl table access failed: ${detailResponse.status}`);
    }
  } catch (error) {
    console.error('❌ Error with detail_bl table:', error);
  }
}

testDetailBLDirect();