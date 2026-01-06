import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔍 Frontend API: Redirecting to backend for delivery notes, tenant: ${tenant}`);
    
    // Rediriger vers le backend local via Tailscale
    const backendUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      }
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Got ${data.data?.length || 0} delivery notes from backend`);
    
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
    const body = await request.json();
    
    console.log(`📝 Frontend API: Redirecting BL creation to backend, tenant: ${tenant}`);
    
    // Rediriger vers le backend local via Tailscale
    const backendUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/delivery-notes';
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: BL created successfully via backend`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}