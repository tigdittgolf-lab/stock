import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: params est maintenant une Promise
    const resolvedParams = await params;
    const id = resolvedParams.id;
    const tenant = request.headers.get('X-Tenant');

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant header required' },
        { status: 400 }
      );
    }

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { success: false, error: 'Valid BL ID required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Frontend API: Getting BL details for ID ${id}, tenant: ${tenant}`);

    // Proxy to backend via tunnel
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
      : 'http://localhost:3005/api';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error:  Backend error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Frontend API: BL details retrieved for ID ${id}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}