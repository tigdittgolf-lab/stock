// Test script pour vérifier l'intégration des informations d'entreprise
import { CompanyService } from './src/services/companyService.js';

async function testCompanyInfo() {
  console.log('🧪 Testing Company Info Integration...\n');

  try {
    // Test 1: Get company info
    console.log('1️⃣ Testing getCompanyInfo()...');
    const companyInfo = await CompanyService.getCompanyInfo();
    console.log('✅ Company Info:', JSON.stringify(companyInfo, null, 2));

    // Test 2: Get formatted header
    console.log('\n2️⃣ Testing getFormattedHeader()...');
    const header = await CompanyService.getFormattedHeader();
    console.log('✅ Formatted Header:', header);

    // Test 3: Get company details
    console.log('\n3️⃣ Testing getCompanyDetails()...');
    const details = await CompanyService.getCompanyDetails();
    console.log('✅ Company Details:', JSON.stringify(details, null, 2));

    // Test 4: Cache functionality
    console.log('\n4️⃣ Testing cache functionality...');
    const start = Date.now();
    await CompanyService.getCompanyInfo(); // Should use cache
    const end = Date.now();
    console.log(`✅ Cache test completed in ${end - start}ms (should be very fast)`);

    // Test 5: Clear cache and reload
    console.log('\n5️⃣ Testing cache clear...');
    CompanyService.clearCache();
    const reloaded = await CompanyService.getCompanyInfo();
    console.log('✅ Cache cleared and reloaded successfully');

    console.log('\n🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testCompanyInfo();