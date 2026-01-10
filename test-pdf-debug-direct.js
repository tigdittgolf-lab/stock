// Test direct de la route PDF debug
async function testPDFDebugDirect() {
  console.log('🚀 Test direct PDF debug BL 3...');
  
  const LOCAL_BACKEND = 'http://localhost:3005';
  
  try {
    const response = await fetch(`${LOCAL_BACKEND}/api/pdf/debug-bl/3`, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`📊 Status PDF debug: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ PDF debug réussi!');
      console.log('📋 Données debug:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('❌ Erreur PDF debug:', text);
    }
    
  } catch (error) {
    console.log(`❌ Erreur:`, error.message);
  }
}

testPDFDebugDirect().catch(console.error);