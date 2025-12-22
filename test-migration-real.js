// Test réel de la migration - Node.js
const fetch = require('node-fetch');

async function testMigrationReal() {
  console.log('🧪 Test RÉEL de migration - A à Z');
  
  try {
    // 1. Test de l'API de migration
    console.log('📡 Test 1: Vérification de l\'API...');
    
    const healthResponse = await fetch('http://localhost:3000/api/admin/migration', {
      method: 'GET'
    });
    
    if (!healthResponse.ok) {
      throw new Error(`API non disponible: ${healthResponse.status}`);
    }
    
    const healthData = await healthResponse.json();
    console.log('✅ API disponible:', healthData.message);
    
    // 2. Test de migration PostgreSQL
    console.log('\n🐘 Test 2: Migration PostgreSQL...');
    
    const sourceConfig = {
      type: 'supabase',
      name: 'Source Supabase',
      supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
      supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
    };
    
    const targetConfig = {
      type: 'postgresql',
      name: 'PostgreSQL Local',
      host: 'localhost',
      port: 5432,
      database: 'test_migration',
      username: 'postgres',
      password: 'postgres'
    };
    
    const options = {
      includeSchema: true,
      includeData: true,
      overwriteExisting: false,
      batchSize: 10
    };
    
    console.log('📤 Envoi requête migration...');
    
    const migrationResponse = await fetch('http://localhost:3000/api/admin/migration', {
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
    
    console.log(`📥 Réponse: ${migrationResponse.status} ${migrationResponse.statusText}`);
    
    const migrationResult = await migrationResponse.json();
    
    if (migrationResult.success) {
      console.log('🎉 MIGRATION RÉUSSIE !');
      console.log('📊 Résumé:', migrationResult.summary);
      
      if (migrationResult.logs) {
        console.log('\n📋 Logs détaillés:');
        migrationResult.logs.forEach((log, index) => {
          console.log(`  ${index + 1}. [${log.step}] ${log.message}`);
        });
      }
    } else {
      console.log('❌ MIGRATION ÉCHOUÉE');
      console.log('🔍 Erreur:', migrationResult.error);
      if (migrationResult.details) {
        console.log('📋 Détails:', migrationResult.details);
      }
    }
    
  } catch (error) {
    console.error('💥 ERREUR PENDANT LE TEST:', error.message);
    console.error('📋 Stack:', error.stack);
  }
}

// Lancer le test
console.log('🚀 Démarrage du test de migration réel...');
testMigrationReal();