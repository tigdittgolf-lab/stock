import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2009_bu02';
    
    console.log(`💰 Fetching supplier debts for tenant: ${tenant}`);

    // Faire la requête vers le backend
    const backendUrl = process.env.BACKEND_URL 
      ? `${process.env.BACKEND_URL}/api`
      : 'http://localhost:3005/api';
    
    const response = await fetch(`${backendUrl}/purchases/supplier-debts`, {
      method: 'GET',
      headers: {
        'X-Tenant': tenant,
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Backend error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { success: false, error: `Backend error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    console.log(`✅ Supplier debts fetched successfully`);

    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Error in supplier debts proxy:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch supplier debts' },
      { status: 500 }
    );
  }
}
