import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://midi-charm-harvard-performed.trycloudflare.com/api'
  : 'http://localhost:3005/api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Next.js 15: params est maintenant une Promise
    const resolvedParams = await params;
    const tenant = request.headers.get('X-Tenant');
    
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Tenant header required' },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching proforma ${resolvedParams.id} for tenant: ${tenant}`);

    const response = await fetch(`${API_BASE_URL}/sales/proforma/${resolvedParams.id}`, {
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error(`Backend error:  Backend error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Proforma ${resolvedParams.id} fetched successfully`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Error fetching proforma:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch proforma' },
      { status: 500 }
    );
  }
}