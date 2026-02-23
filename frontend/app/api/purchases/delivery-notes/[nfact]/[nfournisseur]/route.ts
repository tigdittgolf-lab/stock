import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { nfact: string; nfournisseur: string } }
) {
  try {
    const { nfact, nfournisseur } = params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    
    console.log(`🔍 Frontend API: Proxying purchase BL ${nfact}/${nfournisseur} to backend for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    console.log(`🌐 Backend URL: ${backendUrl}`);
    
    const response = await fetch(`${backendUrl}/purchases/delivery-notes/${encodeURIComponent(nfact)}/${encodeURIComponent(nfournisseur)}`, {
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
    console.log(`✅ Frontend API: Proxied purchase BL ${nfact}/${nfournisseur} from backend`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { nfact: string; nfournisseur: string } }
) {
  try {
    const { nfact, nfournisseur } = params;
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    const body = await request.json();
    
    console.log(`📝 Frontend API: Proxying PUT purchase BL ${nfact}/${nfournisseur} to backend for tenant ${tenant}, DB: ${dbType}`);
    
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    console.log(`🌐 Backend URL: ${backendUrl}`);
    
    const response = await fetch(`${backendUrl}/purchases/delivery-notes/${encodeURIComponent(nfact)}/${encodeURIComponent(nfournisseur)}`, {
      method: 'PUT',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`Backend PUT error: ${response.status} - ${await response.text()}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: PUT purchase BL ${nfact}/${nfournisseur} proxied successfully`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API PUT error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}
