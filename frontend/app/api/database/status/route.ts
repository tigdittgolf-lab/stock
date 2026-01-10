import { NextRequest, NextResponse } from 'next/server';

function getApiUrl() {
  // En production, utiliser Tailscale (URL permanente)
  if (process.env.NODE_ENV === 'production') {
    return 'https://desktop-bhhs068.tail1d9c54.ts.net';
  }
  // En développement, utiliser localhost
  return 'http://localhost:3005';
}

export async function GET(request: NextRequest) {
  try {
    // Rediriger vers le backend via tunnel
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
      : 'http://localhost:3005/api';
    
    const response = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        'X-Tenant': '2025_bu01'
      }
    });
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Database status error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get database status' },
      { status: 500 }
    );
  }
}