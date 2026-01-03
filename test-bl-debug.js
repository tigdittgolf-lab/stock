// Test BL debug endpoint
async function testBLDebug() {
  try {
    console.log('🔍 Testing BL debug endpoint...');
    
    const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/pdf/debug-bl/5', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Response status:', response.status);
    const text = await response.text();
    console.log('📊 Raw response:', text);
    
    try {
      const result = JSON.parse(text);
      console.log('📊 Parsed result:', JSON.stringify(result, null, 2));
    } catch (parseError) {
      console.log('❌ JSON parse error:', parseError.message);
    }
    
    // Also test the BL list to see what's available
    console.log('\n🔍 Testing BL list...');
    const listResponse = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📋 List response status:', listResponse.status);
    const listText = await listResponse.text();
    console.log('📋 List raw response:', listText.substring(0, 500) + '...');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testBLDebug();