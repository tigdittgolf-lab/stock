import { NextRequest, NextResponse } from 'next/server';
import { MigrationServerService as ServerMigrationService, MigrationOptions } from '../../../../lib/database/server-migration-service';
import { DatabaseConfig } from '../../../../lib/database/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceConfig, targetConfig, options }: {
      sourceConfig: DatabaseConfig;
      targetConfig: DatabaseConfig;
      options: MigrationOptions;
    } = body;

    console.log('🔄 Démarrage migration serveur:', {
      source: sourceConfig.type,
      target: targetConfig.type,
      options
    });

    // Validation des configurations
    if (!sourceConfig || !targetConfig) {
      return NextResponse.json({
        success: false,
        error: 'Configurations source et cible requises',
        logs: []
      }, { status: 400 });
    }

    // Créer le service de migration avec callback pour les logs
    const migrationLogs: any[] = [];
    const migrationService = new ServerMigrationService((progress) => {
      migrationLogs.push({
        ...progress,
        timestamp: new Date().toISOString()
      });
      console.log(`[Migration] ${progress.step}: ${progress.message}`);
    });

    try {
      // Initialiser la migration
      const initialized = await migrationService.initializeMigration(sourceConfig, targetConfig);
      
      if (!initialized) {
        return NextResponse.json({
          success: false,
          error: 'Échec de l\'initialisation de la migration',
          logs: migrationLogs
        }, { status: 400 });
      }

      // Lancer la migration
      const success = await migrationService.migrate(options);
      
      return NextResponse.json({
        success: success,
        message: success ? 'Migration terminée avec succès' : 'Migration échouée',
        logs: migrationLogs,
        summary: {
          source: sourceConfig.type,
          target: targetConfig.type,
          includeSchema: options.includeSchema,
          includeData: options.includeData,
          batchSize: options.batchSize,
          totalSteps: migrationLogs.length
        }
      });
    } catch (migrationError) {
      console.error('❌ Erreur pendant la migration:', migrationError);
      return NextResponse.json({
        success: false,
        error: 'Erreur pendant la migration',
        details: migrationError instanceof Error ? migrationError.message : 'Erreur inconnue',
        logs: migrationLogs
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur migration serveur:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Endpoint pour vérifier le statut ou obtenir des informations
    return NextResponse.json({
      success: true,
      message: 'Service de migration disponible',
      supportedDatabases: ['supabase', 'postgresql', 'mysql'],
      features: [
        'Migration automatique des schémas',
        'Migration des données par batch',
        'Vérification d\'intégrité',
        'Logs détaillés',
        'Support multi-tenant'
      ]
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur'
    }, { status: 500 });
  }
}