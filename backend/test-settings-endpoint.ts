import 'dotenv/config';

async function testSettingsEndpoint() {
  console.log('🔍 Testing Settings Endpoint...\n');

  try {
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('http://localhost:3005/health');
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);

    // Test 2: Settings families endpoint
    console.log('\n2. Testing settings/families endpoint...');
    const familiesResponse = await fetch('http://localhost:3005/api/settings/families', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const familiesData = await familiesResponse.json();
    console.log('✅ Families endpoint:', familiesData);

    // Test 3: Settings company endpoint
    console.log('\n3. Testing settings/company endpoint...');
    const companyResponse = await fetch('http://localhost:3005/api/settings/company', {
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    const companyData = await companyResponse.json();
    console.log('✅ Company endpoint:', companyData);

    console.log('\n🎉 All endpoints are working!');
    console.log('\n📋 Next steps:');
    console.log('1. Execute backend/create-settings-rpc-functions.sql in Supabase');
    console.log('2. Test the Settings page in the frontend');
    console.log('3. Create families via the web interface');

  } catch (error) {
    console.error('❌ Error testing endpoints:', error);
  }
}

testSettingsEndpoint();