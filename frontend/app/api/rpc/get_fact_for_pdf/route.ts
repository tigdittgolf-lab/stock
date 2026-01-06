import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json(
    { success: false, error: 'Cette API nécessite une requête POST avec des paramètres' },
    { status: 405 }
  );
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    
    console.log(`🔍 Frontend RPC Proxy - get_fact_for_pdf, Tenant: ${tenant}, Body:`, body);

    // Utiliser Tailscale tunnel pour accéder au backend local
    const backendUrl = `https://desktop-bhhs068.tail1d9c54.ts.net/api/rpc/get_fact_for_pdf`;
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Backend RPC error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Backend RPC error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    // Récupérer les données RPC
    const rpcData = await response.json();
    
    console.log(`✅ RPC data retrieved successfully from backend`);

    return NextResponse.json(rpcData);

  } catch (error) {
    console.error('❌ Error in RPC proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to execute RPC' },
      { status: 500 }
    );
  }
}