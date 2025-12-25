import { NextRequest, NextResponse } from 'next/server';

function getApiUrl() {
  // En production, utiliser le tunnel Cloudflare
  if (process.env.NODE_ENV === 'production') {
    return 'https://his-affects-major-injured.trycloudflare.com';
  }
  // En développement, utiliser localhost
  return 'http://localhost:3005';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Utiliser directement le nouveau tunnel Cloudflare
    const backendUrl = 'https://approach-entire-agriculture-participated.trycloudflare.com/api/database-config';
    
    console.log('Testing database connection via tunnel:', backendUrl);
    
    const response = await fetch(backendUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': '2025_bu01'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Backend response:', data);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { success: false, error: `Failed to test database connection: ${error.message}` },
      { status: 500 }
    );
  }
}