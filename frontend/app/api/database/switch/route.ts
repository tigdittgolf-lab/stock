import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, config } = body;

    console.log('🔄 API Switch Database:', type, config?.name || 'unnamed');

    // Notifier le backend du changement de base de données
    const backendResponse = await fetch('http://localhost:3005/api/database/switch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ type, config })
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend switch failed: ${backendResponse.status}`);
    }

    const backendResult = await backendResponse.json();

    return NextResponse.json({
      success: true,
      message: `Database switched to ${type}`,
      backend: backendResult
    });

  } catch (error) {
    console.error('❌ Erreur switch database API:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Switch database error'
    }, { status: 500 });
  }
}