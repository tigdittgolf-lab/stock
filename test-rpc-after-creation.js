// Test pour vérifier si les fonctions RPC fonctionnent maintenant
async function testRPCAfterCreation() {
    console.log('🔍 Test des fonctions RPC après création...');
    
    try {
        // Configuration de migration avec les vraies valeurs
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
                includeData: false, // Test sans données d'abord
                overwriteExisting: true,
                batchSize: 100
            }
        };

        console.log('🚀 Test migration pour vérifier les colonnes...');
        
        const response = await fetch('http://localhost:3000/api/admin/migration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(migrationConfig)
        });

        const result = await response.json();
        
        console.log(`📊 Statut: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
        
        if (result.logs) {
            // Chercher spécifiquement les logs de création de tables
            const tableCreationLogs = result.logs.filter(log => 
                log.message && (
                    log.message.includes('colonnes') || 
                    log.message.includes('ignorée') ||
                    log.message.includes('créées')
                )
            );
            
            console.log('🔍 LOGS DE CRÉATION DE TABLES:');
            tableCreationLogs.forEach(log => {
                console.log(`  ${log.success ? '✅' : '❌'} ${log.message}`);
            });
            
            // Compter les tables avec colonnes vs sans colonnes
            const ignoredTables = result.logs.filter(log => 
                log.message && log.message.includes('ignorée (0 colonnes)')
            ).length;
            
            const createdTables = result.logs.filter(log => 
                log.message && log.message.includes('créée avec succès')
            ).length;
            
            console.log('\\n📊 RÉSUMÉ:');
            console.log(`  🔨 Tables créées: ${createdTables}`);
            console.log(`  ⚠️ Tables ignorées (0 colonnes): ${ignoredTables}`);
            
            if (ignoredTables > 0 && createdTables === 0) {
                console.log('\\n❌ PROBLÈME CONFIRMÉ: Les fonctions RPC ne récupèrent pas les colonnes');
                console.log('💡 Possible causes:');
                console.log('  1. Les fonctions RPC ont des erreurs');
                console.log('  2. Les permissions ne sont pas correctes');
                console.log('  3. Les schémas/tables n\'existent pas dans Supabase');
                console.log('  4. Les fonctions RPC utilisent une syntaxe incorrecte');
            } else if (createdTables > 0) {
                console.log('\\n✅ SUCCÈS: Les fonctions RPC fonctionnent maintenant!');
            }
        }
        
    } catch (error) {
        console.error(`💥 Erreur test: ${error.message}`);
    }
}

// Exécuter le test
testRPCAfterCreation();