// Vérifier directement ce qui existe dans MySQL
async function checkMySQLTables() {
    console.log('🔍 Vérification directe MySQL...');
    
    try {
        // 1. Lister toutes les bases de données
        console.log('📋 Bases de données existantes:');
        const dbResponse = await fetch('http://localhost:3000/api/database/mysql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                config: {
                    type: 'mysql',
                    host: 'localhost',
                    port: 3306,
                    username: 'root',
                    password: '',
                    database: 'mysql'
                },
                sql: 'SHOW DATABASES',
                params: []
            })
        });

        const dbResult = await dbResponse.json();
        
        if (dbResult.success) {
            const databases = dbResult.data.map(row => row.Database);
            console.log('✅ Bases trouvées:', databases.length);
            
            // Filtrer les bases tenant
            const tenantDbs = databases.filter(db => /^\d{4}_bu\d{2}$/.test(db));
            console.log('📁 Bases tenant:', tenantDbs);
            
            // 2. Pour chaque base tenant, lister les tables
            for (const db of tenantDbs.slice(0, 2)) { // Limiter à 2 pour le test
                console.log(`\\n🔍 Tables dans ${db}:`);
                
                const tablesResponse = await fetch('http://localhost:3000/api/database/mysql', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        config: {
                            type: 'mysql',
                            host: 'localhost',
                            port: 3306,
                            username: 'root',
                            password: '',
                            database: db
                        },
                        sql: 'SHOW TABLES',
                        params: []
                    })
                });

                const tablesResult = await tablesResponse.json();
                
                if (tablesResult.success) {
                    const tables = tablesResult.data.map(row => Object.values(row)[0]);
                    console.log(`  📊 ${tables.length} tables trouvées:`, tables);
                    
                    if (tables.length === 0) {
                        console.log('  ❌ AUCUNE table dans cette base!');
                    }
                } else {
                    console.error(`  ❌ Erreur listage tables ${db}:`, tablesResult.error);
                }
            }
        } else {
            console.error('❌ Erreur listage bases:', dbResult.error);
        }
        
    } catch (error) {
        console.error('💥 Erreur vérification MySQL:', error.message);
    }
}

// Exécuter la vérification
checkMySQLTables();