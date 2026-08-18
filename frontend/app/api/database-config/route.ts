import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const dbType = request.headers.get('X-Database-Type') || 'supabase';

    const backendResponse = await fetch(`${BACKEND_URL}/api/database-config`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('❌ Error forwarding database-config GET:', error);
    return NextResponse.json({ success: false, error: 'Backend injoignable' }, 502);
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    const pathname = request.nextUrl.pathname;

    let endpoint = '/api/database-config';
    if (pathname.endsWith('/test')) endpoint = '/api/database-config/test';
    if (pathname.endsWith('/switch')) endpoint = '/api/database-config/switch';

    const backendResponse = await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || '',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('❌ Error forwarding database config POST:', error);
    return NextResponse.json({ success: false, error: 'Backend injoignable' }, 502);
  }
}