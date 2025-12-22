// Test spécifique de création de table pour identifier le problème
async function testTableCreationDebug() {
    console.log('🔨 Test de création de table avec debug...');
    
    try {
        // Simuler la structure d'une table comme retournée par les RPC
        const tableStructure = {
            tableName: 'test_article',
            columns: [
                {
                    column_name: 'narticle',
                    data_type: 'character varying',
                    character_maximum_length: 20,
                    is_nullable: 'NO',
                    column_default: null,
                    ordinal_position: 1
                },
                {
                    column_name: 'designation',
                    data_type: 'character varying',
                    character_maximum_length: 200,
                    is_nullable: 'YES',
                    column_default: null,
                    ordinal_position: 2
                },
                {
                    column_name: 'prix_unitaire',
                    data_type: 'numeric',
                    character_maximum_length: null,
                    is_nullable: 'YES',
                    column_default: '0',
                    ordinal_position: 3
                }
            ],
            constraints: [
                {
                    constraint_name: 'article_pkey',
                    constraint_type: 'PRIMARY KEY',
                    column_name: 'narticle'
                }
            ]
        };

        // Générer le SQL comme le fait le service de migration
        console.log('📝 Génération du SQL...');
        const createSQL = generateMySQLCreateTableSQL(tableStructure);
        console.log('✅ SQL généré:');
        console.log(createSQL);

        // Tester la création dans une base existante
        console.log('\\n🔨 Test création dans 2025_bu01...');
        
        const response = await fetch('http://localhost:3000/api/database/mysql', {
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
                    database: '2025_bu01'
                },
                sql: createSQL,
                params: []
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Table créée avec succès!');
            
            // Vérifier que la table existe
            const verifyResponse = await fetch('http://localhost:3000/api/database/mysql', {
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
                        database: '2025_bu01'
                    },
                    sql: "SHOW TABLES LIKE 'test_article'",
                    params: []
                })
            });

            const verifyResult = await verifyResponse.json();
            
            if (verifyResult.success && verifyResult.data.length > 0) {
                console.log('✅ Table vérifiée et accessible!');
                console.log('🎯 CONCLUSION: La génération SQL et création fonctionnent!');
                console.log('💡 Le problème est ailleurs dans le processus de migration');
            } else {
                console.log('❌ Table créée mais non trouvée lors de la vérification');
            }
            
        } else {
            console.error('❌ Erreur création table:', result.error);
            console.error('💡 Ceci explique pourquoi la migration échoue');
        }
        
    } catch (error) {
        console.error('💥 Erreur test création:', error.message);
    }
}

// Fonction pour générer le SQL MySQL (copie de la logique de migration)
function generateMySQLCreateTableSQL(table) {
    const tableName = `\`${table.tableName}\``;
    
    // Construire les colonnes
    const columnDefinitions = table.columns.map(col => {
        let columnDef = `${col.column_name} `;
        
        // Mapper les types PostgreSQL vers MySQL
        switch (col.data_type.toLowerCase()) {
            case 'character varying':
            case 'varchar':
                columnDef += `VARCHAR(${col.character_maximum_length || 255})`;
                break;
            case 'text':
                columnDef += 'TEXT';
                break;
            case 'integer':
                columnDef += 'INT';
                break;
            case 'numeric':
            case 'decimal':
                columnDef += 'DECIMAL(10,2)';
                break;
            case 'timestamp without time zone':
                columnDef += 'TIMESTAMP';
                break;
            default:
                columnDef += 'TEXT';
        }

        // Nullable
        if (col.is_nullable === 'NO') {
            columnDef += ' NOT NULL';
        }

        // Default value
        if (col.column_default && col.column_default !== 'NULL') {
            let defaultValue = col.column_default;
            // Nettoyer les defaults PostgreSQL pour MySQL
            if (defaultValue.includes('::')) {
                defaultValue = defaultValue.split('::')[0];
            }
            if (defaultValue.includes('nextval')) {
                // Ignorer les séquences PostgreSQL
            } else {
                columnDef += ` DEFAULT ${defaultValue}`;
            }
        }

        return columnDef;
    }).join(',\n        ');

    // Ajouter les contraintes PRIMARY KEY
    const primaryKeyConstraints = table.constraints.filter(c => c.constraint_type === 'PRIMARY KEY');
    const primaryKeyColumns = [...new Set(primaryKeyConstraints.map(c => c.column_name))];
    
    let primaryKeyClause = '';
    if (primaryKeyColumns.length > 0) {
        primaryKeyClause = `,\n        PRIMARY KEY (${primaryKeyColumns.join(', ')})`;
    }

    return `CREATE TABLE IF NOT EXISTS ${tableName} (
        ${columnDefinitions}${primaryKeyClause}
    )`;
}

// Exécuter le test
testTableCreationDebug();