import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const clientId = params.id;
    
    console.log(`🔄 Frontend API: Fetching client ${clientId} for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl(`/api/sales/clients/${clientId}`);
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
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
    
    console.log(`✅ Frontend API: Successfully fetched client ${clientId}`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend client API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch client: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    const clientId = params.id;
    const body = await request.json();
    
    console.log(`🔄 Frontend API: Updating client ${clientId} for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl(`/api/sales/clients/${clientId}`);
    
    const response = await fetch(backendUrl, {
      method: 'PUT',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend update client API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to update client: ${error instanceof Error ? error.message : 'Unknown error'}`
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
    const clientId = params.id;
    
    console.log(`🔄 Frontend API: Deleting client ${clientId} for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl(`/api/sales/clients/${clientId}`);
    
    const response = await fetch(backendUrl, {
      method: 'DELETE',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend delete client API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to delete client: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
