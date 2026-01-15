import { NextRequest, NextResponse } from 'next/server';

// Cette route utilise le backend pour gérer les utilisateurs
// Le backend supporte MySQL, PostgreSQL et Supabase

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération des utilisateurs via backend multi-DB');

    const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
      headers: {
        'Authorization': request.headers.get('Authorization') || ''
      }
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });

  } catch (error) {
    console.error('❌ Erreur serveur admin users:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔍 Création utilisateur via backend multi-DB:', { ...body, password: '***' });

    const response = await fetch(`${BACKEND_URL}/api/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': request.headers.get('Authorization') || ''
      },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    return NextResponse.json(result, { status: response.status });

  } catch (error) {
    console.error('❌ Erreur création utilisateur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
