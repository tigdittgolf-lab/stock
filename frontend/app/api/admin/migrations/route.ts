import { NextRequest, NextResponse } from 'next/server';

/**
 * API pour gérer les migrations de base de données
 * GET: Obtenir le statut des migrations
 * POST: Appliquer les migrations
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3005';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Récupération du statut des migrations');

    const response = await fetch(`${BACKEND_URL}/api/migrations/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    // Le backend retourne déjà { success: true, data: {...} }
    // On retourne directement les données
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Erreur récupération statut migrations:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la récupération du statut des migrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { database, dryRun } = body;

    console.log('🔄 Application des migrations', { database, dryRun });

    const response = await fetch(`${BACKEND_URL}/api/migrations/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ database, dryRun })
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Migrations appliquées avec succès'
    });

  } catch (error) {
    console.error('❌ Erreur application migrations:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de l\'application des migrations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
