// Test pour voir exactement ce que retourne l'adaptateur Supabase pour discover_table_structure
async function debugAdapterStructure() {
    console.log('🔍 Debug adaptateur Supabase pour discover_table_structure...');
    
    try {
        // Simuler l'appel comme le fait le service de découverte
        const response = await fetch('http://localhost:3000/api/admin/test-adapter-structure', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                supabaseConfig: {
                    type: 'supabase',
                    supabaseUrl: 'https://szgodrjglbpzkrksnroi.supabase.co',
                    supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN6Z29kcmpnbGJwemtya3Nucm9pIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTY0ODA0MywiZXhwIjoyMDgxMjI0MDQzfQ.QXWudNf09Ly0BwZHac2vweYkr-ea_iufIVzcP98zZFU'
                },
                schemaName: '2025_bu01',
                tableName: 'article'
            })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Réponse API:', result);
        } else {
            console.error('❌ Erreur API:', response.status, response.statusText);
        }
        
    } catch (error) {
        console.error('💥 Erreur test adaptateur:', error.message);
    }
}

// Exécuter le test
debugAdapterStructure();