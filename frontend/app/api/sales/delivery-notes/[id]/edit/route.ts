import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';

export async function PUT(
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

    const body = await request.json();
    console.log(`🔄 Frontend API: Updating BL ${resolvedParams.id} for tenant: ${tenant}`);

    const response = await fetch(`${API_BASE_URL}/sales/delivery-notes/${resolvedParams.id}`, {
      method: 'PUT',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error:  Backend error ${response.status}: ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ Frontend API: BL ${resolvedParams.id} updated successfully`);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('❌ Frontend API error updating BL:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update BL' },
      { status: 500 }
    );
  }
}