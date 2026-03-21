import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const tenant = request.headers.get('X-Tenant');
  const dbType = request.headers.get('X-Database-Type') || 'supabase';

  if (!tenant) {
    return NextResponse.json({ success: false, error: 'Tenant header required' }, { status: 400 });
  }

  const body = await request.json();

  try {
    const res = await fetch(`${BACKEND_URL}/api/sales/delivery-notes/${id}`, {
      method: 'PUT',
      headers: {
        'X-Tenant': tenant,
        'X-Database-Type': dbType,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000)
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ success: false, error: `Backend error: ${res.status}` }, { status: res.status });
    }

    return NextResponse.json(await res.json());
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Backend non disponible' }, { status: 503 });
  }
}
