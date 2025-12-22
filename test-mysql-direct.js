// Test direct de MySQL pour identifier le problème
async function testMySQLDirect() {
    console.log('🔧 Test direct MySQL...');
    
    try {
        // Test 1: Connexion de base
        console.log('📡 Test connexion...');
        
        const response1 = await fetch('http://localhost:3000/api/database/mysql', {
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
                sql: 'SELECT VERSION() as version',
                params: []
            })
        });

        const result1 = await response1.json();
        console.log('✅ Connexion MySQL:', result1);
        
        if (!result1.success) {
            console.error('❌ Connexion MySQL échouée:', result1.error);
            return;
        }
        
        // Test 2: Création base
        console.log('🏗️ Test création base...');
        
        const response2 = await fetch('http://localhost:3000/api/database/mysql', {
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
                sql: 'CREATE DATABASE IF NOT EXISTS `test_debug_2025`',
                params: []
            })
        });

        const result2 = await response2.json();
        console.log('✅ Création base:', result2);
        
        if (!result2.success) {
            console.error('❌ Création base échouée:', result2.error);
            return;
        }
        
        // Test 3: Création table
        console.log('🔨 Test création table...');
        
        const createTableSQL = `CREATE TABLE IF NOT EXISTS \`test_table\` (
            id INT PRIMARY KEY AUTO_INCREMENT,
            name VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`;
        
        const response3 = await fetch('http://localhost:3000/api/database/mysql', {
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
                    database: 'test_debug_2025'
                },
                sql: createTableSQL,
                params: []
            })
        });

        const result3 = await response3.json();
        console.log('✅ Création table:', result3);
        
        if (!result3.success) {
            console.error('❌ Création table échouée:', result3.error);
            return;
        }
        
        // Test 4: Vérification table
        console.log('🔍 Test vérification table...');
        
        const response4 = await fetch('http://localhost:3000/api/database/mysql', {
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
                    database: 'test_debug_2025'
                },
                sql: "SHOW TABLES LIKE 'test_table'",
                params: []
            })
        });

        const result4 = await response4.json();
        console.log('✅ Vérification table:', result4);
        
        if (result4.success && result4.data && result4.data.length > 0) {
            console.log('🎯 SUCCÈS: MySQL fonctionne parfaitement!');
            console.log('💡 Le problème est donc dans la logique de migration');
        } else {
            console.error('❌ Table non trouvée après création');
            console.error('💡 Ceci explique le problème de migration');
        }
        
    } catch (error) {
        console.error('💥 Erreur test MySQL:', error);
    }
}

// Exécuter le test
testMySQLDirect();