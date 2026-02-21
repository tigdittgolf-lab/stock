import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/backend-url';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    
    console.log(`🔄 Frontend API: Fetching families for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl('/api/settings/families');
    
    const response = await fetch(backendUrl, {
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
    
    console.log(`✅ Frontend API: Successfully fetched families`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend families API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch families: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const body = await request.json();
    
    console.log(`🔄 Frontend API: Creating family for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = getBackendUrl('/api/settings/families');
    
    const response = await fetch(backendUrl, {
      method: 'POST',
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
    console.error('❌ Frontend create family API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to create family: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}
