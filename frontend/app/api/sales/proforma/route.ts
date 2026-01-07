import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant');
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant header required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`📝 Creating proforma for tenant: ${tenant}`);

    const response = await fetch(`${API_BASE_URL}/sales/proforma`, {
      method: 'POST',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Proforma created successfully`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error creating proforma:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create proforma' },
      { status: 500 }
    );
  }
}