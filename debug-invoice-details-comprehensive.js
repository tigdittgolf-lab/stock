// Comprehensive test to debug invoice details issue
console.log('🔍 Comprehensive Invoice Details Debug...');

// Test different possible queries to find the invoice details
const testQueries = [
  // Test 1: Check if detail_fact table exists and has any data
  'SELECT COUNT(*) as count FROM "2025_bu01".detail_fact;',
  
  // Test 2: Check structure of detail_fact table
  'SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = \'2025_bu01\' AND table_name = \'detail_fact\' ORDER BY ordinal_position;',
  
  // Test 3: Check if there are any details for any invoice
  'SELECT * FROM "2025_bu01".detail_fact LIMIT 5;',
  
  // Test 4: Check details for invoice 2 with lowercase fields
  'SELECT * FROM "2025_bu01".detail_fact WHERE nfact = 2;',
  
  // Test 5: Check details for invoice 2 with uppercase fields
  'SELECT * FROM "2025_bu01".detail_fact WHERE NFact = 2;',
  
  // Test 6: Check if there are details for invoice 1
  'SELECT * FROM "2025_bu01".detail_fact WHERE nfact = 1;',
  
  // Test 7: Check all invoices in fact table
  'SELECT nfact, nclient, montant_ht FROM "2025_bu01".fact ORDER BY nfact;',
  
  // Test 8: Check if there are any other detail tables
  'SELECT table_name FROM information_schema.tables WHERE table_schema = \'2025_bu01\' AND table_name LIKE \'%detail%\';'
];

async function runTest(query, description) {
  try {
    console.log(`\n📋 ${description}`);
    console.log(`SQL: ${query}`);
    
    const response = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/test-exec-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify({ sql: query })
    });
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`);
      return;
    }
    
    const result = await response.json();
    console.log(`✅ Result:`, JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }
}

async function runAllTests() {
  for (let i = 0; i < testQueries.length; i++) {
    await runTest(testQueries[i], `Test ${i + 1}: ${testQueries[i].substring(0, 50)}...`);
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Run in browser console
if (typeof window !== 'undefined') {
  runAllTests();
} else {
  console.log('Run this script in browser console or modify for Node.js');
}