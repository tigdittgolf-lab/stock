import { NextRequest, NextResponse } from 'next/server';

const backendUrl = () => process.env.BACKEND_URL ? `${process.env.BACKEND_URL}/api` : 'http://localhost:3005/api';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenant = request.headers.get('X-Tenant') || '';
    const response = await fetch(`${backendUrl()}/sales/credit-notes/${id}`, {
      headers: { 'X-Tenant': tenant, 'ngrok-skip-browser-warning': 'true' }
    });
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
