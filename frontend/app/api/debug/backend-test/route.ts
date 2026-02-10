import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const BACKEND_URL = process.env.BACKEND_URL || 'NOT_CONFIGURED';
  const results: any = {
    config: {
      BACKEND_URL,
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'false',
    },
    tests: []
  };

  // Test 1: Health check
  try {
    const healthUrl = `${BACKEND_URL}/api/health`;
    results.tests.push({ test: 'Health Check', url: healthUrl, status: 'testing...' });
    
    const healthResponse = await fetch(healthUrl, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    
    results.tests[0].status = healthResponse.status;
    results.tests[0].ok = healthResponse.ok;
    
    if (healthResponse.ok) {
      results.tests[0].data = await healthResponse.json();
    } else {
      results.tests[0].error = await healthResponse.text();
    }
  } catch (error: any) {
    results.tests[0].status = 'ERROR';
    results.tests[0].error = error.message;
  }

  // Test 2: Articles
  try {
    const articlesUrl = `${BACKEND_URL}/api/sales/articles`;
    results.tests.push({ test: 'Articles', url: articlesUrl, status: 'testing...' });
    
    const articlesResponse = await fetch(articlesUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    results.tests[1].status = articlesResponse.status;
    results.tests[1].ok = articlesResponse.ok;
    
    if (articlesResponse.ok) {
      const data = await articlesResponse.json();
      results.tests[1].dataLength = data.data?.length || 0;
      results.tests[1].success = data.success;
    } else {
      results.tests[1].error = await articlesResponse.text();
    }
  } catch (error: any) {
    results.tests[1].status = 'ERROR';
    results.tests[1].error = error.message;
  }

  // Test 3: Clients
  try {
    const clientsUrl = `${BACKEND_URL}/api/sales/clients`;
    results.tests.push({ test: 'Clients', url: clientsUrl, status: 'testing...' });
    
    const clientsResponse = await fetch(clientsUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    results.tests[2].status = clientsResponse.status;
    results.tests[2].ok = clientsResponse.ok;
    
    if (clientsResponse.ok) {
      const data = await clientsResponse.json();
      results.tests[2].dataLength = data.data?.length || 0;
      results.tests[2].success = data.success;
    } else {
      results.tests[2].error = await clientsResponse.text();
    }
  } catch (error: any) {
    results.tests[2].status = 'ERROR';
    results.tests[2].error = error.message;
  }

  // Test 4: Suppliers
  try {
    const suppliersUrl = `${BACKEND_URL}/api/sales/suppliers`;
    results.tests.push({ test: 'Suppliers', url: suppliersUrl, status: 'testing...' });
    
    const suppliersResponse = await fetch(suppliersUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01',
        'Content-Type': 'application/json'
      }
    });
    
    results.tests[3].status = suppliersResponse.status;
    results.tests[3].ok = suppliersResponse.ok;
    
    if (suppliersResponse.ok) {
      const data = await suppliersResponse.json();
      results.tests[3].dataLength = data.data?.length || 0;
      results.tests[3].success = data.success;
    } else {
      results.tests[3].error = await suppliersResponse.text();
    }
  } catch (error: any) {
    results.tests[3].status = 'ERROR';
    results.tests[3].error = error.message;
  }

  return NextResponse.json(results, { status: 200 });
}
