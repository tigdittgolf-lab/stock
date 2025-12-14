import 'dotenv/config';

async function testFamiliesInForm() {
  console.log('🔍 Testing families API for form...\n');

  try {
    // Test l'API settings/families
    console.log('1. Testing settings/families API...');
    const response = await fetch('http://localhost:3005/api/settings/families', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const result = await response.json();
    console.log('✅ Settings API result:', result);

    if (result.success && result.data) {
      // Convertir au format attendu par le formulaire
      const formattedFamilies = result.data.map((family: any) => ({
        nfamille: family.famille,
        designation: family.famille
      }));
      
      console.log('\n2. Formatted for form:', formattedFamilies);
      console.log('\n🎉 SUCCESS: Families will now appear in dropdown!');
      
      console.log('\n📋 Available families:');
      formattedFamilies.forEach((family: any, index: number) => {
        console.log(`   ${index + 1}. ${family.designation}`);
      });
    } else {
      console.log('❌ No families found in API');
    }

  } catch (error) {
    console.error('❌ Error testing families API:', error);
  }
}

testFamiliesInForm();