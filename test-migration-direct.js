// Test direct de la migration sans serveur backend
const { MigrationServerService } = require('./frontend/lib/database/server-migration-service.ts');

async function testMigration() {
  console.log('🧪 Test de migration direct...');
  
  // Configuration source (Supabase)
  const sourceConfig = {
    type: 'supabase',
    name: 'Source Supabase',
    supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
  };
  
  // Configuration cible (PostgreSQL local)
  const targetConfig = {
    type: 'postgresql',
    name: 'PostgreSQL Local',
    host: 'localhost',
    port: 5432,
    database: 'test_migration',
    username: 'postgres',
    password: 'postgres'
  };
  
  // Options de migration
  const options = {
    includeSchema: true,
    includeData: true,
    overwriteExisting: false,
    batchSize: 50
  };
  
  try {
    // Créer le service de migration
    const migrationService = new MigrationServerService((progress) => {
      console.log(`[${progress.step}] ${progress.message} (${progress.progress}/${progress.total})`);
    });
    
    // Initialiser la migration
    console.log('🔄 Initialisation de la migration...');
    const initialized = await migrationService.initializeMigration(sourceConfig, targetConfig);
    
    if (!initialized) {
      console.error('❌ Échec de l\'initialisation');
      return;
    }
    
    console.log('✅ Migration initialisée avec succès');
    
    // Lancer la migration
    console.log('🚀 Démarrage de la migration...');
    const success = await migrationService.migrate(options);
    
    if (success) {
      console.log('🎉 Migration terminée avec succès !');
    } else {
      console.log('❌ Migration échouée');
    }
    
  } catch (error) {
    console.error('💥 Erreur pendant le test:', error);
  }
}

// Lancer le test
testMigration();