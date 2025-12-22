import { NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database/database-service';

export async function GET() {
  try {
    const databaseType = DatabaseService.getActiveDatabaseType();
    const isSupabase = DatabaseService.isSupabaseActive();
    const isLocal = DatabaseService.isLocalDatabaseActive();

    return NextResponse.json({
      success: true,
      data: {
        type: databaseType,
        isSupabase,
        isLocal,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Erreur détection type base de données:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      fallback: 'supabase'
    }, { status: 500 });
  }
}