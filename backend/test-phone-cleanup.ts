// Tester le nettoyage du numéro de téléphone
async function testPhoneCleanup() {
  console.log('🧪 Testing phone number cleanup...');
  
  try {
    const response = await fetch('http://localhost:3005/api/cache/status', {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result = await response.json();
    
    if (response.ok && result.companyInfo) {
      console.log('✅ Company info retrieved:');
      console.log(`📞 Phone (cleaned): "${result.companyInfo.phone}"`);
      console.log(`📧 Email: "${result.companyInfo.email}"`);
      console.log(`🏢 Name: "${result.companyInfo.name}"`);
      
      // Vérifier que le téléphone ne contient plus "Tèl :"
      if (result.companyInfo.phone.includes('Tèl :') || result.companyInfo.phone.includes('Tél :')) {
        console.log('❌ Phone still contains prefix - cleanup failed');
      } else {
        console.log('✅ Phone prefix successfully removed!');
      }
      
    } else {
      console.error('❌ Failed to get company info:', result);
    }
    
  } catch (error) {
    console.error('❌ Error testing phone cleanup:', error);
  }
}

testPhoneCleanup();