import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();

    const backendResponse = await fetch(`${BACKEND_URL}/api/database-config/test`, {
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
    console.error('❌ Error forwarding database-config test:', error);
    return NextResponse.json({ success: false, error: 'Backend injoignable' }, 502);
  }
}