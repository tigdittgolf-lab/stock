import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔍 Frontend API: Proxying invoices to backend for tenant ${tenant}`);
    
    // Faire la requête vers le backend local via Tailscale
    const backendUrl = `https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} - ${await response.text()}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Proxied ${data.data?.length || 0} invoices from backend`);

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
    
    console.log(`📝 Frontend API: Proxying POST invoice to backend for tenant ${tenant}`);
    
    // Faire la requête vers le backend local via Tailscale
    const backendUrl = `https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`❌ Backend POST error: ${response.status} - ${await response.text()}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: POST invoice proxied successfully`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}