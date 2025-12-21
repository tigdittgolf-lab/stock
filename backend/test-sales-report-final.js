// Test final pour le rapport des ventes
const testSalesReportFinal = async () => {
  console.log('🎯 FINAL SALES REPORT TEST');
  console.log('==========================');
  
  const baseURL = 'http://localhost:3005/api/sales/report';
  const tenant = '2025_bu01';
  
  const tests = [
    {
      name: 'Frontend Default (ALL type, year range)',
      params: 'dateFrom=2025-01-01&dateTo=2025-12-21&type=ALL'
    },
    {
      name: 'Today Only (should be empty)',
      params: 'dateFrom=2025-12-21&dateTo=2025-12-21&type=ALL'
    },
    {
      name: 'BL Only',
      params: 'dateFrom=2025-01-01&dateTo=2025-12-31&type=BL'
    },
    {
      name: 'Factures Only',
      params: 'dateFrom=2025-01-01&dateTo=2025-12-31&type=FACTURE'
    }
  ];
  
  for (const test of tests) {
    try {
      console.log(`\n📊 Testing: ${test.name}`);
      
      const response = await fetch(`${baseURL}?${test.params}`, {
        headers: { 'X-Tenant': tenant }
      });
      
      if (response.ok) {
        const data = await response.json();
        const totals = data.data?.totals || {};
        
        console.log(`✅ Success: ${data.success}`);
        console.log(`   Sales: ${data.data?.sales?.length || 0}`);
        console.log(`   BL: ${totals.count_bl || 0}`);
        console.log(`   Factures: ${totals.count_factures || 0}`);
        console.log(`   CA: ${totals.total_ttc?.toFixed(2) || '0.00'} DA`);
        
        if (data.data?.sales?.length > 0) {
          const sample = data.data.sales[0];
          console.log(`   Sample: ${sample.type} ${sample.numero} - ${sample.client_name} (${sample.date})`);
        }
      } else {
        const errorText = await response.text();
        console.log(`❌ Error ${response.status}: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 EXPECTED FRONTEND BEHAVIOR:');
  console.log('1. Page loads with year range (2025-01-01 to today)');
  console.log('2. Shows all sales (BL + Factures)');
  console.log('3. User can filter by "Aujourd\'hui seulement"');
  console.log('4. User can filter by document type');
};

testSalesReportFinal().catch(console.error);