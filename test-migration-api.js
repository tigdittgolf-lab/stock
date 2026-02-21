/**
 * Test de l'API de migration avec la configuration correcte
 */

async function testMigration() {
  console.log('🔄 TEST DE LA MIGRATION MYSQL → SUPABASE\n');
  console.log('='.repeat(70));

  // Configuration MySQL source
  const sourceConfig = {
    type: 'mysql',
    name: 'MySQL Local',
    host: 'localhost',
    port: 3306,
    database: '2025_bu01', // ⚠️ IMPORTANT
    username: 'root',
    password: '' // Vide par défaut
  };

  // Configuration Supabase cible
  const targetConfig = {
    type: 'supabase',
    name: 'Supabase Cloud',
    supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
  };

  // Options de migration
  const options = {
    includeSchema: true,
    includeData: true,
    overwriteExisting: false,
    batchSize: 100
  };

  console.log('\n📤 SOURCE (MySQL):');
  console.log('  Type:', sourceConfig.type);
  console.log('  Host:', sourceConfig.host);
  console.log('  Port:', sourceConfig.port);
  console.log('  Database:', sourceConfig.database);
  console.log('  Username:', sourceConfig.username);

  console.log('\n📥 CIBLE (Supabase):');
  console.log('  Type:', targetConfig.type);
  console.log('  URL:', targetConfig.supabaseUrl);

  console.log('\n⚙️  OPTIONS:');
  console.log('  Inclure structure:', options.includeSchema);
  console.log('  Inclure données:', options.includeData);
  console.log('  Écraser existant:', options.overwriteExisting);
  console.log('  Taille des lots:', options.batchSize);

  console.log('\n' + '='.repeat(70));
  console.log('\n🚀 Lancement de la migration...\n');

  try {
    const response = await fetch('http://localhost:3000/api/admin/migration', {
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

    console.log('📡 Statut HTTP:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('\n❌ ERREUR HTTP:', response.status);
      console.error('📄 Réponse:', errorText);
      
      // Essayer de parser comme JSON
      try {
        const errorJson = JSON.parse(errorText);
        console.error('\n📋 Détails de l\'erreur:');
        console.error('  Message:', errorJson.error);
        console.error('  Détails:', errorJson.details);
        if (errorJson.logs && errorJson.logs.length > 0) {
          console.error('\n📝 Logs de migration:');
          errorJson.logs.forEach((log, index) => {
            console.error(`  ${index + 1}. [${log.step}] ${log.message}`);
            if (log.error) {
              console.error(`     ❌ Erreur: ${log.error}`);
            }
          });
        }
      } catch (e) {
        // Pas du JSON, afficher le texte brut
      }
      
      return;
    }

    const result = await response.json();

    console.log('\n✅ RÉPONSE REÇUE\n');
    console.log('='.repeat(70));
    
    if (result.success) {
      console.log('\n✅ MIGRATION RÉUSSIE!\n');
      console.log('📊 Résumé:');
      if (result.summary) {
        console.log('  Source:', result.summary.source);
        console.log('  Cible:', result.summary.target);
        console.log('  Structure:', result.summary.includeSchema ? 'Oui' : 'Non');
        console.log('  Données:', result.summary.includeData ? 'Oui' : 'Non');
        console.log('  Étapes:', result.summary.totalSteps);
      }
      
      if (result.logs && result.logs.length > 0) {
        console.log('\n📝 Logs de migration:');
        result.logs.forEach((log, index) => {
          const icon = log.success ? '✅' : '❌';
          console.log(`  ${icon} [${log.step}] ${log.message} (${log.progress}/${log.total})`);
          if (log.error) {
            console.log(`     ❌ Erreur: ${log.error}`);
          }
        });
      }
    } else {
      console.log('\n❌ MIGRATION ÉCHOUÉE\n');
      console.log('Erreur:', result.error);
      if (result.details) {
        console.log('Détails:', result.details);
      }
      
      if (result.logs && result.logs.length > 0) {
        console.log('\n📝 Logs de migration:');
        result.logs.forEach((log, index) => {
          const icon = log.success ? '✅' : '❌';
          console.log(`  ${icon} [${log.step}] ${log.message}`);
          if (log.error) {
            console.log(`     ❌ Erreur: ${log.error}`);
          }
        });
      }
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERREUR FATALE:', error.message);
    console.error('\n💡 Vérifier que:');
    console.error('  1. Le serveur Next.js est démarré (npm run dev)');
    console.error('  2. Le serveur écoute sur http://localhost:3000');
    console.error('  3. MySQL est accessible sur localhost:3306');
    console.error('  4. La base 2025_bu01 existe dans MySQL');
  }
}

// Lancer le test
testMigration();
