// Tester les fonctions RPC pour les détails BL
async function testBLDetailsRPC() {
  console.log('🧪 Testing RPC functions for BL details...');
  
  const detailRPCFunctions = [
    'get_bl_details',
    'get_bl_details_by_id',
    'get_bl_details_by_tenant',
    'get_detail_bl',
    'get_detail_bl_by_id',
    'get_detail_bl_by_tenant',
    'get_bl_with_details',
    'get_bl_with_details_by_id',
    'get_delivery_note_details',
    'get_delivery_note_with_details'
  ];
  
  const workingFunctions = [];
  
  for (const funcName of detailRPCFunctions) {
    try {
      console.log(`🔍 Testing RPC function: ${funcName}`);
      
      const response = await fetch(`https://szgodrjglbpzkrksnroi.supabase.co/rest/v1/rpc/${funcName}`, {
        method: 'POST',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          p_tenant: '2025_bu01',
          p_nfact: 5,
          p_nbl: 5
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Function ${funcName} EXISTS and returned:`, {
          dataType: Array.isArray(data) ? 'array' : typeof data,
          length: Array.isArray(data) ? data.length : 'N/A',
          sample: Array.isArray(data) && data.length > 0 ? data[0] : data
        });
        workingFunctions.push({
          name: funcName,
          data: data,
          count: Array.isArray(data) ? data.length : 0
        });
      } else {
        console.log(`❌ Function ${funcName} failed: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ Function ${funcName} error: ${error.message}`);
    }
  }
  
  console.log('\n📋 SUMMARY - Working BL Details RPC functions:');
  workingFunctions.forEach(func => {
    console.log(`  ✅ ${func.name}: ${func.count} records`);
    if (func.count > 0 && func.data[0]) {
      console.log(`     Sample fields: ${Object.keys(func.data[0]).join(', ')}`);
    }
  });
  
  return workingFunctions;
}

testBLDetailsRPC();