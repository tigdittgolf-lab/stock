import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';

    const backendResponse = await fetch(`${BACKEND_URL}/api/license`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('❌ Error forwarding license status:', error);
    return NextResponse.json({ success: false, error: 'Backend injoignable' }, 502);
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    const path = request.nextUrl.pathname;

    const backendResponse = await fetch(`${BACKEND_URL}/api/license${path.endsWith('/activate') ? '/activate' : ''}`, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body)
    });

    const data = await backendResponse.json();
    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    console.error('❌ Error forwarding license action:', error);
    return NextResponse.json({ success: false, error: 'Backend injoignable' }, 502);
  }
}