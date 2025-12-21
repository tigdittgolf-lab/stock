import { DatabaseConfig } from './types';

export interface MigrationProgress {
  step: string;
  progress: number;
  total: number;
  message: string;
  success: boolean;
  error?: string;
}

export interface MigrationOptions {
  includeSchema: boolean;
  includeData: boolean;
  overwriteExisting: boolean;
  batchSize: number;
  tenants?: string[];
}

/**
 * Service de migration côté client - Interface uniquement
 * La vraie migration se fait côté serveur via API
 */
export class ClientMigrationService {
  private progressCallback?: (progress: MigrationProgress) => void;

  constructor(progressCallback?: (progress: MigrationProgress) => void) {
    this.progressCallback = progressCallback;
  }

  /**
   * Lance la migration via l'API serveur
   */
  async migrate(
    sourceConfig: DatabaseConfig,
    targetConfig: DatabaseConfig,
    options: MigrationOptions = {
      includeSchema: true,
      includeData: true,
      overwriteExisting: false,
      batchSize: 100
    }
  ): Promise<boolean> {
    try {
      this.reportProgress('Initialisation', 0, 100, 'Envoi de la demande de migration...', true);

      const response = await fetch('/api/admin/migration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceConfig,
          targetConfig,
          options
        })
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        // Rejouer les logs du serveur
        if (result.logs && Array.isArray(result.logs)) {
          result.logs.forEach((log: any, index: number) => {
            setTimeout(() => {
              this.reportProgress(log.step, log.progress, log.total, log.message, log.success, log.error);
            }, index * 100); // Délai pour simuler le temps réel
          });
        }

        // Message final
        setTimeout(() => {
          this.reportProgress('Terminé', 100, 100, 'Migration terminée avec succès !', true);
        }, (result.logs?.length || 0) * 100 + 500);

        return true;
      } else {
        throw new Error(result.error || 'Erreur migration');
      }

    } catch (error) {
      this.reportProgress('Erreur', 0, 100, 'Migration échouée', false,
        error instanceof Error ? error.message : 'Erreur inconnue');
      return false;
    }
  }

  /**
   * Test de connexion via API
   */
  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const response = await fetch('/api/admin/migration/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ config })
      });

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error('Erreur test connexion:', error);
      return false;
    }
  }

  /**
   * Rapporte le progrès de la migration
   */
  private reportProgress(step: string, progress: number, total: number, message: string, success: boolean, error?: string): void {
    const progressData: MigrationProgress = {
      step,
      progress,
      total,
      message,
      success,
      error
    };

    console.log(`[Migration] ${step}: ${message} (${progress}/${total})`);
    
    if (this.progressCallback) {
      this.progressCallback(progressData);
    }
  }
}

// Export du service client
export { ClientMigrationService as MigrationService };