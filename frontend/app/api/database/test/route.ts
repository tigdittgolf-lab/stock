import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Utiliser Tailscale (URL permanente) avec le bon endpoint
    const backendUrl = `${process.env.NODE_ENV === 'production' ? 'https://desktop-bhhs068.tail1d9c54.ts.net' : 'http://localhost:3005'}/api/database/test`;
    
    console.log('Testing database connection via tunnel:', backendUrl);
    console.log('Test config:', body);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error response:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Backend test response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to test database connection: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}