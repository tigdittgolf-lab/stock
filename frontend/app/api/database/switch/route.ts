import { NextRequest, NextResponse } from 'next/server';
import { getApiUrl } from '../../../../lib/config';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Rediriger vers l'API backend via tunnel
    const response = await fetch(getApiUrl('database-config'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Transférer les headers d'authentification si présents
        ...(request.headers.get('authorization') && {
          'Authorization': request.headers.get('authorization')!
        })
      },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
    
  } catch (error) {
    console.error('Error in database switch API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}