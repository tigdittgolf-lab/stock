import { NextRequest, NextResponse } from 'next/server';

const backendUrl = () => process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://localhost:3005/api';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '';
    const response = await fetch(`${backendUrl()}/sales/credit-notes`, {
      headers: { 'X-Tenant': tenant, 'ngrok-skip-browser-warning': 'true' }
    });
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '';
    const body = await request.json();
    const response = await fetch(`${backendUrl()}/sales/credit-notes`, {
      method: 'POST',
      headers: { 'X-Tenant': tenant, 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify(body)
    });
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
