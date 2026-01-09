// Test detail_bl table data
async function testDetailBLData() {
  console.log('🧪 Testing detail_bl table data...');
  
  const SUPABASE_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';
  
  try {
    // Test 1: Check BL list to see what BLs exist
    console.log('\n1️⃣ Checking BL list...');
    const blResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_delivery_notes`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ p_tenant: '2025_bu01' })
    });
    
    if (blResponse.ok) {
      const blData = await blResponse.json();
      console.log('✅ BL list:', blData.map(bl => ({
        nbl: bl.nbl,
        nfact: bl.nfact,
        nclient: bl.nclient,
        date_bl: bl.date_bl
      })));
    } else {
      console.log(`❌ BL list failed: ${blResponse.status}`);
    }
    
    // Test 2: Try to access detail_bl table directly
    console.log('\n2️⃣ Checking detail_bl table...');
    
    // Try with schema
    const detailResponse1 = await fetch(`${SUPABASE_URL}/rest/v1/2025_bu01.detail_bl?select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (detailResponse1.ok) {
      const detailData1 = await detailResponse1.json();
      console.log('✅ detail_bl with schema (2025_bu01.detail_bl):', {
        count: detailData1.length,
        sample: detailData1.slice(0, 3)
      });
    } else {
      console.log(`⚠️ detail_bl with schema failed: ${detailResponse1.status}`);
      
      // Try without schema
      const detailResponse2 = await fetch(`${SUPABASE_URL}/rest/v1/detail_bl?select=*`, {
        method: 'GET',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (detailResponse2.ok) {
        const detailData2 = await detailResponse2.json();
        console.log('✅ detail_bl without schema:', {
          count: detailData2.length,
          sample: detailData2.slice(0, 3)
        });
      } else {
        console.log(`❌ detail_bl without schema failed: ${detailResponse2.status}`);
      }
    }
    
    // Test 3: Check for BL 5 specifically
    console.log('\n3️⃣ Checking details for BL 5...');
    const bl5Response = await fetch(`${SUPABASE_URL}/rest/v1/detail_bl?nfact=eq.5&select=*`, {
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (bl5Response.ok) {
      const bl5Data = await bl5Response.json();
      console.log('✅ Details for BL 5 (NFact=5):', {
        count: bl5Data.length,
        data: bl5Data
      });
    } else {
      console.log(`❌ BL 5 details failed: ${bl5Response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testDetailBLData();