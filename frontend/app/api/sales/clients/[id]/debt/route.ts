import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const tenant = request.headers.get('x-tenant') || '2009_bu02';
    const dbType = request.headers.get('x-database-type') || 'supabase';
    
    console.log(`💰 Frontend Proxy - Fetching client debt for ID: ${id}, Tenant: ${tenant}, DB: ${dbType}`);

    // Faire la requête vers le backend
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    const response = await fetch(`${backendUrl}/sales/clients/${id}/debt`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status} - ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`✅ Client debt fetched successfully for client ${id}`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error in client debt proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch client debt' },
      { status: 500 }
    );
  }
}
