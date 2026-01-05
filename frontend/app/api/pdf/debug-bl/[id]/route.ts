import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔍 Frontend Debug Proxy - BL ID: ${id}, Tenant: ${tenant}`);

    // Faire la requête vers le backend local via le proxy frontend
    const backendUrl = `https://desktop-bhhs068.tail1d9c54.ts.net/api/pdf/debug-bl/${id}`;
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Backend debug error: ${response.status} - ${await response.text()}`);
      return NextResponse.json(
        { success: false, error: `Backend debug error: ${response.status}` },
        { status: response.status }
      );
    }

    // Récupérer les données de debug
    const debugData = await response.json();
    
    console.log(`✅ Debug data retrieved for BL ${id}`);

    return NextResponse.json(debugData);

  } catch (error) {
    console.error('❌ Error in debug proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get debug data' },
      { status: 500 }
    );
  }
}