// Test du système multi-tenant pour les informations d'entreprise
import { CompanyService } from './src/services/companyService.js';

async function testMultiTenantCompany() {
  console.log('🧪 Testing Multi-Tenant Company Info...\n');

  try {
    // Test pour différents tenants
    const tenants = ['2025_bu01', '2025_bu02'];

    for (const tenant of tenants) {
      console.log(`📋 Testing tenant: ${tenant}`);
      
      try {
        // Test getCompanyInfo avec tenant spécifique
        const companyInfo = await CompanyService.getCompanyInfo(tenant);
        console.log(`✅ Company for ${tenant}:`, companyInfo.name);
        console.log(`   Address: ${companyInfo.address}`);
        console.log(`   Phone: ${companyInfo.phone}`);
        console.log(`   Email: ${companyInfo.email}`);
        
        // Test getFormattedHeader
        const header = await CompanyService.getFormattedHeader(tenant);
        console.log(`   Header: ${header.replace(/\n/g, ' | ')}`);
        
      } catch (error) {
        console.error(`❌ Error testing ${tenant}:`, error.message);
      }
      
      console.log(''); // Ligne vide
    }

    // Test avec tenant par défaut
    console.log('📋 Testing default tenant (no parameter)');
    const defaultInfo = await CompanyService.getCompanyInfo();
    console.log(`✅ Default company: ${defaultInfo.name}`);

    console.log('\n🎉 Multi-tenant tests completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testMultiTenantCompany();