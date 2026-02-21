import { NextRequest, NextResponse } from 'next/server';

// Configuration du backend via variable d'environnement
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    
    console.log(`🔄 Frontend API: Forwarding clients request to backend for tenant ${tenant}, DB: ${dbType}`);
    console.log(`🌐 BACKEND_URL configured: ${BACKEND_URL}`);
    console.log(`🎯 Full URL: ${BACKEND_URL}/api/sales/clients`);
    
    // Forwarder la requête vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/sales/clients`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    
    console.log(`✅ Frontend API: Received ${data.data?.length || 0} clients from backend (${data.database_type || 'unknown'} database)`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error forwarding to backend:', error);
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
    
    console.log(`🔄 Frontend API: Forwarding client creation to backend for tenant ${tenant}, DB: ${dbType}`);
    
    // Forwarder la requête vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/api/sales/clients`, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    
    console.log(`✅ Frontend API: Client created via backend (${data.database_type || 'unknown'} database)`);
    
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error forwarding to backend:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}