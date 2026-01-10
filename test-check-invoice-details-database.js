// Simple test to check invoice details in database
async function testInvoiceDetailsDatabase() {
  try {
    console.log('🔍 Testing invoice details in database...');
    
    // Test 1: Check if detail_fact table has any data
    console.log('\n📋 Test 1: Checking detail_fact table...');
    const response1 = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/test-exec-sql', {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const result1 = await response1.json();
    console.log('exec_sql test result:', result1);
    
    // Test 2: Check invoice list to see what invoices exist
    console.log('\n📋 Test 2: Checking invoice list...');
    const response2 = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices', {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const result2 = await response2.json();
    console.log('Invoice list result:', JSON.stringify(result2, null, 2));
    
    // Test 3: Check specific invoice 2
    console.log('\n📋 Test 3: Checking invoice 2 details...');
    const response3 = await fetch('https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices/2', {
      headers: { 'X-Tenant': '2025_bu01' }
    });
    const result3 = await response3.json();
    console.log('Invoice 2 result:', JSON.stringify(result3, null, 2));
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run in browser console or Node.js
if (typeof window !== 'undefined') {
  // Browser
  testInvoiceDetailsDatabase();
} else {
  // Node.js
  const fetch = require('node-fetch');
  testInvoiceDetailsDatabase();
}