import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Utiliser Tailscale (URL permanente) avec le bon endpoint
    const backendUrl = `${process.env.NODE_ENV === 'production' ? 'https://desktop-bhhs068.tail1d9c54.ts.net' : 'http://localhost:3005'}/api/database/switch`;
    
    console.log('Switching database via tunnel:', backendUrl);
    console.log('Switch config:', body);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01',
        // Transférer les headers d'authentification si présents
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify({ type: body.type, config: body })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend switch error response:', response.status, errorText);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Backend switch response:', data);
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error in database switch API:', error);
    return NextResponse.json(
      { success: false, error: `Failed to switch database: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}