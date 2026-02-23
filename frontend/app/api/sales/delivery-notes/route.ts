import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    
    console.log(`🔍 Frontend API: Proxying to backend for tenant ${tenant}, DB: ${dbType}`);
    
    // Faire la requête vers le backend (ngrok ou local)
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    console.log(`🌐 Backend URL: ${backendUrl}`);
    
    const response = await fetch(`${backendUrl}/sales/delivery-notes`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      console.error(`Backend error: ${response.status} - ${await response.text()}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Proxied ${data.data?.length || 0} delivery notes from backend (${data.database_type || 'unknown'} database)`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const body = await request.json();
    
    console.log(`📝 Frontend API: Proxying POST to backend for tenant ${tenant}, DB: ${dbType}`);
    
    // Faire la requête vers le backend (ngrok ou local)
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    console.log(`🌐 Backend URL: ${backendUrl}`);
    
    const response = await fetch(`${backendUrl}/sales/delivery-notes`, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`Backend POST error: ${response.status} - ${await response.text()}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: POST proxied successfully (${data.database_type || 'unknown'} database)`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}