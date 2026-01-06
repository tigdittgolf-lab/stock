import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔄 Frontend API: Forwarding invoices request for tenant: ${tenant}`);

    // Utiliser Tailscale tunnel pour accéder au backend local
    const backendUrl = 'https://desktop-bhhs068.tail1d9c54.ts.net/api/sales/invoices';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Successfully forwarded invoices data`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch invoices: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}