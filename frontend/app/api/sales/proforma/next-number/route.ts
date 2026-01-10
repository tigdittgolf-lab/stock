import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://frontend-iota-six-72.vercel.app/api'
  : 'http://localhost:3005/api';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant');
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant header required' },
        { status: 400 }
      );
    }

    console.log(`🔢 Getting next proforma number for tenant: ${tenant}`);

    const response = await fetch(`${API_BASE_URL}/sales/proforma/next-number`, {
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`❌ Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Next proforma number fetched successfully`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error getting next proforma number:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get next proforma number' },
      { status: 500 }
    );
  }
}