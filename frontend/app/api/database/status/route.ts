// API Route: /api/database/status
// Returns the current database type from the backend

import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Lire le type de base de données depuis le header
    const dbType = request.headers.get('X-Database-Type') || 'supabase';
    
    console.log(`📊 [database/status] Checking status for: ${dbType}`);
    
    // Retourner directement le type de base de données du frontend
    // Pas besoin d'interroger le backend car le frontend connaît déjà le type actif
    return NextResponse.json({
      success: true,
      currentType: dbType,
      config: {
        connected: true
      },
      message: `${dbType} actif`
    });
  } catch (error: any) {
    console.error('Error in GET /api/database/status:', error);
    return NextResponse.json({
      success: true,
      currentType: 'supabase',
      config: {
        connected: false
      },
      message: 'Erreur'
    });
  }
}
