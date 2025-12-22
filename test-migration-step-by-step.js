// Test de migration étape par étape pour identifier le problème exact
async function testMigrationStepByStep() {
    console.log('🚀 Test migration étape par étape...');
    
    try {
        // Configuration de migration
        const migrationConfig = {
            sourceConfig: {
                type: 'supabase',
                supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
                supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
                url: 'https://szgodrjglbpzkrksnroi.supabase.co',
                key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
                host: 'szgodrjglbpzkrksnroi.supabase.co',
                database: 'postgres'
            },
            targetConfig: {
                type: 'mysql',
                host: 'localhost',
                port: 3306,
                username: 'root',
                password: '',
                database: 'mysql'
            },
            options: {
                includeSchema: true,
                includeData: false, // Pas de données pour ce test
                overwriteExisting: true,
                batchSize: 100
            }
        };

        console.log('📡 Lancement migration avec logs détaillés...');
        
        const response = await fetch('http://localhost:3000/api/admin/migration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(migrationConfig)
        });

        console.log(`📊 Statut HTTP: ${response.status}`);
        
        const result = await response.json();
        
        console.log(`📊 Résultat migration: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
        
        if (result.error) {
            console.error(`❌ Erreur principale: ${result.error}`);
        }
        
        if (result.details) {
            console.warn(`💡 Détails: ${result.details}`);
        }

        // Analyser TOUS les logs en détail
        if (result.logs && result.logs.length > 0) {
            console.log('📋 ANALYSE DÉTAILLÉE DES LOGS:');
            
            result.logs.forEach((logEntry, index) => {
                const status = logEntry.success ? '✅' : (logEntry.error ? '❌' : '🔄');
                console.log(`[${index + 1}] ${status} ${logEntry.step}: ${logEntry.message}`);
                
                if (logEntry.error) {
                    console.error(`    ❌ ERREUR: ${logEntry.error}`);
                }
            });
            
            // Analyser les étapes critiques
            const discoveryLog = result.logs.find(log => log.step === 'Découverte');
            const tablesLog = result.logs.find(log => log.step === 'Tables');
            const verificationLog = result.logs.find(log => log.step === 'Vérification');
            
            console.log('\n🔍 DIAGNOSTIC DÉTAILLÉ:');
            
            if (discoveryLog) {
                console.log(`  📋 Découverte: ${discoveryLog.success ? '✅ OK' : '❌ ÉCHEC'}`);
                if (discoveryLog.error) {
                    console.error(`      Erreur: ${discoveryLog.error}`);
                }
            }
            
            if (tablesLog) {
                console.log(`  🔨 Création tables: ${tablesLog.success ? '✅ OK' : '❌ ÉCHEC'}`);
                if (tablesLog.error) {
                    console.error(`      Erreur: ${tablesLog.error}`);
                }
            }
            
            if (verificationLog) {
                console.log(`  🔍 Vérification: ${verificationLog.success ? '✅ OK' : '❌ ÉCHEC'}`);
                if (verificationLog.error) {
                    console.error(`      Erreur: ${verificationLog.error}`);
                }
            }
            
            // Conclusion
            console.log('\n💡 CONCLUSION:');
            if (discoveryLog?.success && tablesLog?.error) {
                console.log('  🎯 La découverte fonctionne mais la création de tables échoue');
                console.log('  🔧 Vérifier la génération SQL et l\'exécution MySQL dans les logs serveur');
            } else if (discoveryLog?.error) {
                console.log('  🎯 La découverte échoue - vérifier les fonctions RPC Supabase');
            } else if (verificationLog?.error) {
                console.log('  🎯 Les tables ne sont pas créées - problème dans l\'exécution MySQL');
            }
        }

        // Afficher le résumé
        if (result.summary) {
            console.log('\n📊 RÉSUMÉ:');
            console.log(`  Source: ${result.summary.source} → Cible: ${result.summary.target}`);
            console.log(`  Schéma: ${result.summary.includeSchema}, Données: ${result.summary.includeData}`);
            console.log(`  Étapes totales: ${result.summary.totalSteps}`);
        }

    } catch (error) {
        console.error(`💥 Erreur test migration: ${error.message}`);
        console.error(error.stack);
    }
}

// Exécuter le test
testMigrationStepByStep();