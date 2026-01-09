// Test available RPC functions for BL details
async function testBLRPCFunctions() {
  console.log('🧪 Testing BL RPC functions...');
  
  const SUPABASE_URL = 'https://szgodrjglbpzkrksnroi.supabase.co';
  const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU';
  
  const rpcFunctions = [
    'get_bl_by_id',
    'get_bl_details_by_id',
    'get_bl_details',
    'get_bl_complete_by_id',
    'get_delivery_note_details',
    'get_detail_bl_by_tenant'
  ];
  
  for (const funcName of rpcFunctions) {
    try {
      console.log(`\n🔍 Testing RPC function: ${funcName}`);
      
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${funcName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
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
        console.log(`✅ ${funcName} works:`, {
          dataType: typeof data,
          isArray: Array.isArray(data),
          length: Array.isArray(data) ? data.length : 'N/A',
          hasDetails: data?.details ? data.details.length : 'N/A',
          sample: Array.isArray(data) ? data[0] : data
        });
      } else {
        const errorText = await response.text();
        console.log(`❌ ${funcName} failed: ${response.status} - ${errorText.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`❌ ${funcName} error: ${error.message}`);
    }
  }
}

testBLRPCFunctions();