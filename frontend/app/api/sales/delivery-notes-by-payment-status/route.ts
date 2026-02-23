import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    
    // Get the payment status from query params
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    
    console.log(`🔍 Frontend API: Proxying payment status filter to backend - tenant: ${tenant}, DB: ${dbType}, status: ${status}`);
    
    // Proxy to backend
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    console.log(`🌐 Backend URL: ${backendUrl}/sales/delivery-notes-by-payment-status?status=${status}`);
    
    const response = await fetch(`${backendUrl}/sales/delivery-notes-by-payment-status?status=${status}`, {
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
      console.error(`❌ Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status}`
      }, { status: response.status });
    }

    const data = await response.json();
    console.log(`✅ Frontend API: Proxied ${data.count || 0} delivery notes with status ${status} from backend`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Frontend API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur'
    }, { status: 500 });
  }
}
