import { NextRequest, NextResponse } from 'next/server';

// Configuration du backend via Tailscale (URL PERMANENTE)
const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'http://localhost:3005'
  : 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    console.log(`🔄 Frontend API: Forwarding health check to backend`);
    
    // Forwarder la requête vers le backend
    const backendResponse = await fetch(`${BACKEND_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend responded with status ${backendResponse.status}`);
    }

    const data = await backendResponse.json();
    
    console.log(`✅ Frontend API: Health check successful`);
    
    return NextResponse.json({
      ...data,
      frontend_mode: process.env.NODE_ENV,
      backend_url: BACKEND_URL
    });

  } catch (error) {
    console.error('❌ Frontend API health check failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur serveur',
      frontend_mode: process.env.NODE_ENV,
      backend_url: BACKEND_URL
    }, { status: 500 });
  }
}