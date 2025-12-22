// Test spécifique de l'adaptateur Supabase pour voir ce qu'il retourne
async function debugAdapterRPC() {
    console.log('🔍 Debug de l\'adaptateur Supabase...');
    
    try {
        // Test via l'API de migration pour voir les logs détaillés
        const response = await fetch('http://localhost:3000/api/admin/test-discovery', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                supabaseConfig: {
                    type: 'supabase',
                    supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
                    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
                }
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ API test-discovery réussie');
            
            // Analyser les structures d'exemple
            if (result.results.sampleStructures) {
                console.log('\\n🔍 ANALYSE DES STRUCTURES:');
                
                Object.keys(result.results.sampleStructures).forEach(key => {
                    const structure = result.results.sampleStructures[key];
                    console.log(`\\n📋 ${key}:`);
                    console.log(`  📊 Colonnes: ${structure.columns?.length || 0}`);
                    console.log(`  📊 Enregistrements: ${structure.record_count || 0}`);
                    
                    if (structure.columns && structure.columns.length > 0) {
                        console.log('  ✅ COLONNES TROUVÉES:');
                        structure.columns.slice(0, 3).forEach(col => {
                            console.log(`    - ${col.column_name} (${col.data_type})`);
                        });
                        if (structure.columns.length > 3) {
                            console.log(`    ... et ${structure.columns.length - 3} autres`);
                        }
                    } else {
                        console.log('  ❌ AUCUNE COLONNE TROUVÉE!');
                        console.log('  📋 Structure complète:', JSON.stringify(structure, null, 2));
                    }
                });
                
                // Compter les structures avec et sans colonnes
                const structuresWithColumns = Object.values(result.results.sampleStructures)
                    .filter(s => s.columns && s.columns.length > 0).length;
                const totalStructures = Object.keys(result.results.sampleStructures).length;
                
                console.log('\\n📊 RÉSUMÉ STRUCTURES:');
                console.log(`  ✅ Avec colonnes: ${structuresWithColumns}`);
                console.log(`  ❌ Sans colonnes: ${totalStructures - structuresWithColumns}`);
                console.log(`  📊 Total: ${totalStructures}`);
                
                if (structuresWithColumns === 0) {
                    console.log('\\n🚨 PROBLÈME IDENTIFIÉ: L\'adaptateur ne récupère pas les colonnes!');
                } else {
                    console.log('\\n✅ L\'adaptateur récupère bien les colonnes!');
                }
            } else {
                console.log('❌ Aucune structure d\'exemple trouvée');
            }
        } else {
            console.error('❌ Erreur API test-discovery:', result.error);
        }
        
    } catch (error) {
        console.error('💥 Erreur debug adaptateur:', error.message);
    }
}

// Exécuter le debug
debugAdapterRPC();