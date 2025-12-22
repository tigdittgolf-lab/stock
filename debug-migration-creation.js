// Test pour capturer spécifiquement les logs de création de tables
async function debugMigrationCreation() {
    console.log('🔍 Debug spécifique de la création de tables...');
    
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

        console.log('🚀 Lancement migration pour capturer les logs de création...');
        
        // Capturer le timestamp de début
        const startTime = Date.now();
        
        const response = await fetch('http://localhost:3000/api/admin/migration', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(migrationConfig)
        });

        const result = await response.json();
        
        console.log(`📊 Migration terminée: ${result.success ? 'SUCCÈS' : 'ÉCHEC'}`);
        
        // Attendre un peu pour que tous les logs soient écrits
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Maintenant, récupérer les logs du serveur depuis le début de la migration
        console.log('\\n📋 RECHERCHE DES LOGS DE CRÉATION:');
        console.log('Regardez les logs du serveur frontend pour voir:');
        console.log('  - 🔧 Création table [nom] ([X] colonnes)...');
        console.log('  - 📝 SQL généré pour [nom]:');
        console.log('  - 🔄 Exécution MySQL sur base [schema]...');
        console.log('  - ✅ Table [nom] créée avec succès');
        console.log('');
        console.log('Si vous ne voyez AUCUN de ces logs, cela signifie que:');
        console.log('  1. Toutes les tables sont ignorées (0 colonnes)');
        console.log('  2. La méthode createAllRealTables n\'est pas appelée');
        console.log('  3. Il y a une exception qui arrête le processus');
        
        // Analyser les logs de résultat
        if (result.logs) {
            const creationLogs = result.logs.filter(log => 
                log.step === 'Tables' || 
                (log.message && (
                    log.message.includes('Création') || 
                    log.message.includes('créée') ||
                    log.message.includes('ignorée')
                ))
            );
            
            console.log('\\n📋 LOGS DE CRÉATION TROUVÉS:');
            if (creationLogs.length > 0) {
                creationLogs.forEach(log => {
                    console.log(`  ${log.success ? '✅' : '❌'} ${log.message}`);
                });
            } else {
                console.log('  ❌ AUCUN log de création trouvé dans les résultats!');
            }
        }
        
    } catch (error) {
        console.error('💥 Erreur debug création:', error.message);
    }
}

// Exécuter le debug
debugMigrationCreation();