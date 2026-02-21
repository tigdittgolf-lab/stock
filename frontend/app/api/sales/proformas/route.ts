import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔄 Frontend API: Forwarding proformas request for tenant: ${tenant}`);

    // Appeler le backend local directement
    const backendUrl = `${process.env.NODE_ENV === 'production' ? 'https://midi-charm-harvard-performed.trycloudflare.com' : 'http://localhost:3005'}/api/sales/proforma`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error:  Backend error: ${response.status} - ${errorText}`);
      
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Successfully forwarded proformas data`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json({
      success: false,
      error: `Failed to fetch proformas: ${error instanceof Error ? error.message : 'Unknown error'}`
    }, { status: 500 });
  }
}