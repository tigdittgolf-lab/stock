// Debug spécifique des fonctions RPC pour identifier le problème exact
const { createClient } = require('@supabase/supabase-js');

async function debugRPCFunctions() {
    console.log('🔍 Debug des fonctions RPC Supabase...');
    
    try {
        // Créer le client Supabase
        const supabase = createClient(
            'https://szgodrjglbpzkrksnroi.supabase.co',
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
        );

        console.log('✅ Client Supabase créé');

        // Test 1: discover_tenant_schemas
        console.log('\\n🔍 Test 1: discover_tenant_schemas');
        try {
            const { data: schemas, error: schemaError } = await supabase.rpc('discover_tenant_schemas');
            
            if (schemaError) {
                console.error('❌ Erreur discover_tenant_schemas:', schemaError.message);
            } else {
                console.log('✅ discover_tenant_schemas fonctionne');
                console.log('📋 Schémas trouvés:', schemas);
            }
        } catch (e) {
            console.error('💥 Exception discover_tenant_schemas:', e.message);
        }

        // Test 2: discover_schema_tables pour un schéma spécifique
        console.log('\\n🔍 Test 2: discover_schema_tables pour 2025_bu01');
        try {
            const { data: tables, error: tablesError } = await supabase.rpc('discover_schema_tables', {
                p_schema_name: '2025_bu01'
            });
            
            if (tablesError) {
                console.error('❌ Erreur discover_schema_tables:', tablesError.message);
            } else {
                console.log('✅ discover_schema_tables fonctionne');
                console.log('📋 Tables trouvées:', tables?.length || 0);
                if (tables && tables.length > 0) {
                    console.log('📋 Premières tables:', tables.slice(0, 3).map(t => t.table_name));
                }
            }
        } catch (e) {
            console.error('💥 Exception discover_schema_tables:', e.message);
        }

        // Test 3: discover_table_structure pour une table spécifique
        console.log('\\n🔍 Test 3: discover_table_structure pour 2025_bu01.article');
        try {
            const { data: structure, error: structureError } = await supabase.rpc('discover_table_structure', {
                p_schema_name: '2025_bu01',
                p_table_name: 'article'
            });
            
            if (structureError) {
                console.error('❌ Erreur discover_table_structure:', structureError.message);
                console.error('💡 Détails erreur:', structureError);
            } else {
                console.log('✅ discover_table_structure fonctionne');
                console.log('📋 Structure brute:', typeof structure, structure);
                
                // Parser la structure si c'est du JSON
                let parsedStructure = structure;
                if (typeof structure === 'string') {
                    try {
                        parsedStructure = JSON.parse(structure);
                    } catch (parseError) {
                        console.error('❌ Erreur parsing JSON:', parseError.message);
                        console.log('📋 Contenu brut:', structure);
                    }
                }
                
                if (parsedStructure && parsedStructure.columns) {
                    console.log('📊 Colonnes trouvées:', parsedStructure.columns.length);
                    if (parsedStructure.columns.length > 0) {
                        console.log('📋 Premières colonnes:', parsedStructure.columns.slice(0, 3).map(c => c.column_name));
                    } else {
                        console.log('❌ PROBLÈME: 0 colonnes dans la structure!');
                    }
                } else {
                    console.log('❌ PROBLÈME: Pas de propriété columns dans la structure!');
                    console.log('📋 Structure reçue:', parsedStructure);
                }
            }
        } catch (e) {
            console.error('💥 Exception discover_table_structure:', e.message);
        }

        // Test 4: Vérifier si la table existe vraiment
        console.log('\\n🔍 Test 4: Vérification directe de la table article');
        try {
            const { data: directData, error: directError } = await supabase
                .from('article')
                .select('*')
                .limit(1);
            
            if (directError) {
                console.log('⚠️ Accès direct à la table article échoué:', directError.message);
                console.log('💡 Cela peut être normal si la table est dans un schéma spécifique');
            } else {
                console.log('✅ Accès direct à la table article réussi');
                console.log('📊 Données trouvées:', directData?.length || 0);
            }
        } catch (e) {
            console.log('⚠️ Exception accès direct:', e.message);
        }

        console.log('\\n🎯 DIAGNOSTIC TERMINÉ');

    } catch (error) {
        console.error('💥 Erreur générale:', error.message);
    }
}

// Exécuter le debug
debugRPCFunctions();