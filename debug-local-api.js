// Debug script to test local API connectivity
console.log('🔍 Testing Local API Connectivity...');

// Test 1: Check if backend is running
async function testBackendHealth() {
  try {
    console.log('\n1️⃣ Testing backend health...');
    const response = await fetch('http://localhost:3005/health');
    const data = await response.json();
    console.log('✅ Backend health:', data);
    return true;
  } catch (error) {
    console.error('❌ Backend health failed:', error.message);
    return false;
  }
}

// Test 2: Test API endpoint directly
async function testSuppliersEndpoint() {
  try {
    console.log('\n2️⃣ Testing suppliers endpoint directly...');
    const response = await fetch('http://localhost:3005/api/sales/suppliers', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('✅ Suppliers data:', data);
    return true;
  } catch (error) {
    console.error('❌ Suppliers endpoint failed:', error.message);
    return false;
  }
}

// Test 3: Test CORS preflight
async function testCORSPreflight() {
  try {
    console.log('\n3️⃣ Testing CORS preflight...');
    const response = await fetch('http://localhost:3005/api/sales/suppliers', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3001',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type, X-Tenant'
      }
    });
    
    console.log('CORS preflight status:', response.status);
    console.log('CORS headers:', Object.fromEntries(response.headers.entries()));
    return true;
  } catch (error) {
    console.error('❌ CORS preflight failed:', error.message);
    return false;
  }
}

// Run all tests
async function runTests() {
  console.log('🚀 Starting API connectivity tests...\n');
  
  const healthOk = await testBackendHealth();
  if (!healthOk) {
    console.log('\n❌ Backend is not running. Please start it first with: npm run dev:backend');
    return;
  }
  
  await testSuppliersEndpoint();
  await testCORSPreflight();
  
  console.log('\n✅ All tests completed!');
}

// Run in Node.js environment
if (typeof window === 'undefined') {
  // Node.js - use node-fetch
  const fetch = (await import('node-fetch')).default;
  global.fetch = fetch;
  runTests();
} else {
  // Browser environment
  runTests();
}