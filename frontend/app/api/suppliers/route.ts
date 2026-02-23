import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔄 Frontend API: Forwarding suppliers request for tenant ${tenant}`);
    
    // Utiliser BACKEND_URL pour accéder au backend
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:3005'}/api/suppliers`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error:  Backend suppliers error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    
    console.log(`✅ Frontend API: Successfully forwarded suppliers for tenant ${tenant}, found ${data.data?.length || 0} suppliers`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend suppliers API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch suppliers: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    
    console.log(`🔄 Frontend API: Forwarding create supplier request for tenant ${tenant}`);
    
    const backendUrl = `${process.env.BACKEND_URL || 'http://localhost:3005'}/api/suppliers`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('❌ Frontend create supplier API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to create supplier: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}