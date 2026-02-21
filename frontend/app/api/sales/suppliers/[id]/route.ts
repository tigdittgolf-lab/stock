import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const supplierId = params.id;
    
    console.log(`🔄 Frontend API: Fetching supplier ${supplierId} for tenant ${tenant}, DB: ${dbType}`);
    
    const response = await fetch(`${BACKEND_URL}/api/sales/suppliers/${supplierId}`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Successfully fetched supplier ${supplierId}`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend supplier API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch supplier: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const supplierId = params.id;
    const body = await request.json();
    
    console.log(`🔄 Frontend API: Updating supplier ${supplierId} for tenant ${tenant}, DB: ${dbType}`);
    
    const response = await fetch(`${BACKEND_URL}/api/sales/suppliers/${supplierId}`, {
      method: 'PUT',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend update supplier API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to update supplier: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const supplierId = params.id;
    
    console.log(`🔄 Frontend API: Deleting supplier ${supplierId} for tenant ${tenant}, DB: ${dbType}`);
    
    const response = await fetch(`${BACKEND_URL}/api/sales/suppliers/${supplierId}`, {
      method: 'DELETE',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend delete supplier API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to delete supplier: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
