import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://desktop-bhhs068.tail1d9c54.ts.net/api'
  : 'http://localhost:3005/api';

export async function GET(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    console.log(`🔍 Récupération des familles pour le tenant: ${tenant}`);

    const response = await fetch(`${API_BASE_URL}/settings/families`, {
      headers: {
        'X-Tenant': tenant
      }
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Erreur serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const body = await request.json();
    
    console.log(`🔍 Création famille pour le tenant: ${tenant}`, body);

    const response = await fetch(`${API_BASE_URL}/settings/families`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant': tenant
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Erreur création famille:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const tenant = request.headers.get('X-Tenant') || '2025_bu01';
    const url = new URL(request.url);
    const famille = url.pathname.split('/').pop();
    
    console.log(`🔍 Suppression famille pour le tenant: ${tenant}`, famille);

    const response = await fetch(`${API_BASE_URL}/settings/families/${encodeURIComponent(famille || '')}`, {
      method: 'DELETE',
      headers: {
        'X-Tenant': tenant
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({
        success: false,
        error: `Backend error: ${response.status} - ${errorText}`
      }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Erreur suppression famille:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}