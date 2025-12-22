// Test direct des fonctions RPC pour vérifier qu'elles existent et fonctionnent
async function testRPCFunctionsDirect() {
    console.log('🔍 Test direct des fonctions RPC Supabase...');
    
    try {
        // Configuration Supabase correcte
        const supabaseConfig = {
            type: 'supabase',
            supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
            supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
        };

        console.log('📡 Test via API test-discovery...');
        
        const response = await fetch('http://localhost:3000/api/admin/test-discovery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ supabaseConfig })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ API test-discovery fonctionne!');
            console.log(`📊 Résumé: ${result.summary.schemasFound} schémas, ${result.summary.totalTables} tables`);
            
            if (result.results.schemas) {
                console.log('📋 Schémas trouvés:');
                result.results.schemas.forEach(schema => {
                    const tableCount = result.results.tables[schema]?.length || 0;
                    console.log(`  📁 ${schema}: ${tableCount} tables`);
                    
                    // Afficher quelques tables pour diagnostic
                    if (result.results.tables[schema] && result.results.tables[schema].length > 0) {
                        const firstFewTables = result.results.tables[schema].slice(0, 3);
                        console.log(`    📋 Exemples: ${firstFewTables.map(t => t.table_name).join(', ')}`);
                    }
                });
            }
            
            if (result.results.sampleStructures) {
                console.log('🔧 Structures d\'exemple:');
                Object.keys(result.results.sampleStructures).forEach(key => {
                    const structure = result.results.sampleStructures[key];
                    console.log(`  📋 ${key}:`);
                    console.log(`    📊 ${structure.columns?.length || 0} colonnes, ${structure.record_count || 0} enregistrements`);
                    
                    // Afficher les colonnes pour diagnostic
                    if (structure.columns && structure.columns.length > 0) {
                        const columnNames = structure.columns.slice(0, 5).map(col => col.column_name).join(', ');
                        console.log(`    🔧 Colonnes: ${columnNames}${structure.columns.length > 5 ? '...' : ''}`);
                    } else {
                        console.log(`    ❌ PROBLÈME: Aucune colonne trouvée!`);
                    }
                });
            }
            
            // Diagnostic du problème
            console.log('\\n🔍 DIAGNOSTIC:');
            if (result.summary.totalTables > 0) {
                console.log('✅ Les tables sont découvertes correctement');
                
                if (result.summary.rpcFunctionsWorking) {
                    console.log('✅ Les fonctions RPC fonctionnent');
                    
                    // Vérifier si les structures ont des colonnes
                    const structuresWithColumns = Object.values(result.results.sampleStructures || {})
                        .filter(s => s.columns && s.columns.length > 0).length;
                    
                    if (structuresWithColumns > 0) {
                        console.log('✅ Les structures de colonnes sont récupérées');
                        console.log('🎯 CONCLUSION: Les fonctions RPC fonctionnent parfaitement!');
                    } else {
                        console.log('❌ PROBLÈME: Les structures n\'ont pas de colonnes');
                        console.log('💡 Les fonctions RPC discover_table_structure ne fonctionnent pas correctement');
                    }
                } else {
                    console.log('❌ PROBLÈME: Les fonctions RPC ne fonctionnent pas');
                    console.log('💡 Vérifier que les fonctions RPC sont créées dans Supabase');
                }
            } else {
                console.log('❌ PROBLÈME: Aucune table découverte');
                console.log('💡 Vérifier la fonction discover_tenant_schemas');
            }
        } else {
            console.error(`❌ Erreur API test-discovery: ${result.error}`);
            if (result.details) {
                console.error(`💡 Détails: ${result.details}`);
            }
        }
    } catch (error) {
        console.error(`💥 Erreur test RPC: ${error.message}`);
    }
}

// Exécuter le test
testRPCFunctionsDirect();