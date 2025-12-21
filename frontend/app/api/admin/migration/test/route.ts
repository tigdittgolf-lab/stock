import { NextRequest, NextResponse } from 'next/server';
import { MigrationServerService as ServerMigrationService } from '../../../../../lib/database/server-migration-service';
import { DatabaseConfig } from '../../../../../lib/database/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { config }: { config: DatabaseConfig } = body;

    console.log('🧪 Test connexion serveur:', config.type, config.name);

    // Créer le service de migration pour tester la connexion
    const migrationService = new ServerMigrationService();
    
    // Tester la connexion
    const success = await migrationService.testConnection(config);
    
    return NextResponse.json({
      success: success,
      message: success ? 'Connexion réussie' : 'Connexion échouée',
      config: {
        type: config.type,
        name: config.name,
        host: config.host,
        port: config.port,
        database: config.database
      }
    });

  } catch (error) {
    console.error('❌ Erreur test connexion serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}