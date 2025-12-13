import { supabaseAdmin } from './src/supabaseClient.js';

async function checkTenantData() {
  console.log('🔍 Checking data in tenant schemas...');
  
  // Check BU01 data
  console.log('\n📊 BU01 (2025_bu01) data:');
  const { data: bu01BL, error: bu01Error } = await supabaseAdmin.rpc('exec_sql', {
    sql: 'SELECT nfact, date_fact, nclient FROM "2025_bu01".bl ORDER BY nfact LIMIT 5;'
  });
  
  if (bu01Error) {
    console.log('❌ BU01 error:', bu01Error.message);
  } else {
    console.log('   Delivery notes:', bu01BL?.length || 0);
    bu01BL?.forEach(bl => console.log(`   - BL ${bl.nfact}: ${bl.date_fact} (Client: ${bl.nclient})`));
  }
  
  // Check BU02 data
  console.log('\n📊 BU02 (2025_bu02) data:');
  const { data: bu02BL, error: bu02Error } = await supabaseAdmin.rpc('exec_sql', {
    sql: 'SELECT nfact, date_fact, nclient FROM "2025_bu02".bl ORDER BY nfact LIMIT 5;'
  });
  
  if (bu02Error) {
    console.log('❌ BU02 error:', bu02Error.message);
  } else {
    console.log('   Delivery notes:', bu02BL?.length || 0);
    bu02BL?.forEach(bl => console.log(`   - BL ${bl.nfact}: ${bl.date_fact} (Client: ${bl.nclient})`));
  }

  // Check company info for both tenants
  console.log('\n🏢 Company info test:');
  
  const { data: bu01Company } = await supabaseAdmin.rpc('get_company_info', {
    p_tenant: '2025_bu01'
  });
  console.log('   BU01 Company:', bu01Company?.[0]?.raison_sociale || 'Not found');
  
  const { data: bu02Company } = await supabaseAdmin.rpc('get_company_info', {
    p_tenant: '2025_bu02'
  });
  console.log('   BU02 Company:', bu02Company?.[0]?.raison_sociale || 'Not found');
}

checkTenantData().catch(console.error);