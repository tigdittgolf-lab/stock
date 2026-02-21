import { NextRequest, NextResponse } from 'next/server';
import { CompleteMigrationService as TrueMigrationService } from '../../../../../lib/database/true-migration-service';
import { DatabaseConfig } from '../../../../../lib/database/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceConfig, targetConfig }: {
      sourceConfig: DatabaseConfig;
      targetConfig: DatabaseConfig;
    } = body;

    console.log('🧪 Test de connexion migration:', {
      source: sourceConfig.type,
      target: targetConfig.type
    });

    // Validation des configurations
    if (!sourceConfig || !targetConfig) {
      return NextResponse.json({
        success: false,
        error: 'Configurations source et cible requises'
      }, { status: 400 });
    }

    // Créer le service de migration
    const migrationService = new TrueMigrationService();

    try {
      // Tester les connexions
      const sourceOk = await migrationService.testConnection(sourceConfig);
      const targetOk = await migrationService.testConnection(targetConfig);

      if (!sourceOk) {
        return NextResponse.json({
          success: false,
          error: 'Impossible de se connecter à la source',
          sourceOk: false,
          targetOk
        });
      }

      if (!targetOk) {
        return NextResponse.json({
          success: false,
          error: 'Impossible de se connecter à la cible',
          sourceOk,
          targetOk: false
        });
      }

      return NextResponse.json({
        success: true,
        message: 'Connexions source et cible OK',
        sourceOk: true,
        targetOk: true
      });

    } catch (testError) {
      console.error('❌ Erreur test connexion:', testError);
      return NextResponse.json({
        success: false,
        error: 'Erreur test connexion',
        details: testError instanceof Error ? testError.message : 'Erreur inconnue'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Erreur test migration:', error);
    return NextResponse.json({
      success: false,
      error: 'Erreur interne du serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
