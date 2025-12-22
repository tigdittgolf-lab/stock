// Test final pour voir exactement ce que retourne la découverte après correction
async function debugDiscoveryFinal() {
    console.log('🔍 Debug final de la découverte...');
    
    try {
        // Configuration exacte utilisée par la migration
        const migrationConfig = {
            sourceConfig: {
                type: 'supabase',
                supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
                supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
                url: 'https://szgodrjglbpzkrksnroi.supabase.co',
                key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU',
                host: 'szgodrjglbpzkrksnroi.supabase.co',
                database: 'postgres'
            }
        };

        // Tester la découverte via l'API test-discovery
        console.log('📡 Test découverte via API...');
        
        const response = await fetch('http://localhost:3000/api/admin/test-discovery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ supabaseConfig: migrationConfig.sourceConfig })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Découverte réussie');
            
            // Analyser les résultats en détail
            console.log('\\n📊 ANALYSE DÉTAILLÉE:');
            console.log(`Schémas trouvés: ${result.results.schemas?.length || 0}`);
            
            if (result.results.schemas) {
                let totalTablesWithColumns = 0;
                let totalTablesWithoutColumns = 0;
                
                result.results.schemas.forEach(schema => {
                    const tables = result.results.tables[schema] || [];
                    console.log(`\\n📁 ${schema}: ${tables.length} tables`);
                    
                    // Pour chaque table, vérifier si elle a des colonnes dans sampleStructures
                    tables.forEach(table => {
                        const structureKey = `${schema}.${table.table_name}`;
                        const structure = result.results.sampleStructures[structureKey];
                        
                        if (structure && structure.columns && structure.columns.length > 0) {
                            console.log(`  ✅ ${table.table_name}: ${structure.columns.length} colonnes`);
                            totalTablesWithColumns++;
                        } else {
                            console.log(`  ❌ ${table.table_name}: 0 colonnes`);
                            totalTablesWithoutColumns++;
                        }
                    });
                });
                
                console.log('\\n🎯 RÉSUMÉ FINAL:');
                console.log(`  ✅ Tables avec colonnes: ${totalTablesWithColumns}`);
                console.log(`  ❌ Tables sans colonnes: ${totalTablesWithoutColumns}`);
                console.log(`  📊 Total: ${totalTablesWithColumns + totalTablesWithoutColumns}`);
                
                if (totalTablesWithColumns === 0) {
                    console.log('\\n🚨 PROBLÈME: Toutes les tables ont 0 colonnes!');
                    console.log('💡 Cela explique pourquoi aucune table n\'est créée dans la migration');
                    
                    // Afficher un exemple de structure problématique
                    const firstStructure = Object.values(result.results.sampleStructures)[0];
                    if (firstStructure) {
                        console.log('\\n📋 Exemple de structure problématique:');
                        console.log(JSON.stringify(firstStructure, null, 2));
                    }
                } else {
                    console.log('\\n✅ Des tables ont des colonnes, la migration devrait fonctionner');
                }
            }
        } else {
            console.error('❌ Erreur découverte:', result.error);
        }
        
    } catch (error) {
        console.error('💥 Erreur debug final:', error.message);
    }
}

// Exécuter le debug
debugDiscoveryFinal();